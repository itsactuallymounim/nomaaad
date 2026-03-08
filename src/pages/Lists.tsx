import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Plus, Trash2, ArrowLeft, Search, MapPin, Star, Share2, Compass,
  BookmarkPlus, MoreHorizontal, Edit2, Check, X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface SavedList {
  id: string;
  name: string;
  description: string;
  icon: string;
  created_at: string;
  places?: SavedPlace[];
}

interface SavedPlace {
  id: string;
  list_id: string;
  name: string;
  description: string;
  address: string;
  lat: number;
  lng: number;
  category: string;
  rating: number | null;
  price: number | null;
  image_url: string | null;
}

const CACHE_KEY = 'nomaaad_lists_cache';

function cacheData(lists: SavedList[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ lists, timestamp: Date.now() }));
  } catch {}
}

function getCachedData(): SavedList[] | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { lists } = JSON.parse(raw);
    return lists;
  } catch {
    return null;
  }
}

export default function Lists() {
  const { user } = useAuth();
  const [lists, setLists] = useState<SavedList[]>([]);
  const [selectedList, setSelectedList] = useState<SavedList | null>(null);
  const [loading, setLoading] = useState(true);
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('📍');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addPlaceOpen, setAddPlaceOpen] = useState(false);
  const [newPlace, setNewPlace] = useState({ name: '', description: '', address: '', category: 'activity' });

  const fetchLists = useCallback(async () => {
    if (!user) return;
    try {
      const { data: listsData, error } = await supabase
        .from('saved_lists')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const listsWithPlaces: SavedList[] = [];
      for (const list of listsData || []) {
        const { data: places } = await supabase
          .from('saved_places')
          .select('*')
          .eq('list_id', list.id)
          .order('created_at', { ascending: false });
        listsWithPlaces.push({ ...list, places: places || [] });
      }
      setLists(listsWithPlaces);
      cacheData(listsWithPlaces);
    } catch {
      // Load from cache on failure (offline)
      const cached = getCachedData();
      if (cached) {
        setLists(cached);
        toast({ title: 'Offline mode', description: 'Showing cached data.' });
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    // Load cache first for instant display
    const cached = getCachedData();
    if (cached) {
      setLists(cached);
      setLoading(false);
    }
    fetchLists();
  }, [fetchLists]);

  const createList = async () => {
    if (!user || !newListName.trim()) return;
    const { data, error } = await supabase
      .from('saved_lists')
      .insert({ user_id: user.id, name: newListName.trim(), icon: newListIcon })
      .select()
      .single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    const newList = { ...data, places: [] };
    setLists(prev => [newList, ...prev]);
    setNewListName('');
    setNewListIcon('📍');
    setDialogOpen(false);
    toast({ title: 'List created' });
  };

  const deleteList = async (listId: string) => {
    await supabase.from('saved_lists').delete().eq('id', listId);
    setLists(prev => prev.filter(l => l.id !== listId));
    if (selectedList?.id === listId) setSelectedList(null);
    toast({ title: 'List deleted' });
  };

  const addPlace = async () => {
    if (!user || !selectedList || !newPlace.name.trim()) return;
    const { data, error } = await supabase
      .from('saved_places')
      .insert({
        list_id: selectedList.id,
        user_id: user.id,
        name: newPlace.name.trim(),
        description: newPlace.description,
        address: newPlace.address,
        category: newPlace.category,
      })
      .select()
      .single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setLists(prev =>
      prev.map(l =>
        l.id === selectedList.id ? { ...l, places: [data, ...(l.places || [])] } : l
      )
    );
    setSelectedList(prev => prev ? { ...prev, places: [data, ...(prev.places || [])] } : null);
    setNewPlace({ name: '', description: '', address: '', category: 'activity' });
    setAddPlaceOpen(false);
    toast({ title: 'Place added' });
  };

  const deletePlace = async (placeId: string) => {
    await supabase.from('saved_places').delete().eq('id', placeId);
    setLists(prev =>
      prev.map(l => ({ ...l, places: l.places?.filter(p => p.id !== placeId) }))
    );
    if (selectedList) {
      setSelectedList(prev => prev ? { ...prev, places: prev.places?.filter(p => p.id !== placeId) } : null);
    }
  };

  const shareOnWhatsApp = (list: SavedList) => {
    const places = list.places?.map((p, i) => `${i + 1}. ${p.name}${p.address ? ` — ${p.address}` : ''}`).join('\n') || '';
    const text = `🗺 ${list.icon} ${list.name}\n\n${places}\n\nShared from nomaaad ✈️`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareListPlaces = (list: SavedList) => {
    const places = list.places?.map((p, i) => `${i + 1}. ${p.name}${p.address ? ` — ${p.address}` : ''}`).join('\n') || '';
    const text = `🗺 ${list.icon} ${list.name}\n\n${places}\n\nShared from nomaaad`;
    if (navigator.share) {
      navigator.share({ title: list.name, text }).catch(() => {});
    } else {
      shareOnWhatsApp(list);
    }
  };

  const icons = ['📍', '🛏', '☕', '🍜', '🧑‍💻', '🎒', '⭐', '🏖', '🎉', '🧘'];

  const filteredLists = lists.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Detail view
  if (selectedList) {
    const list = lists.find(l => l.id === selectedList.id) || selectedList;
    return (
      <div className="min-h-screen bg-background">
        <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
          <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
            <Button variant="ghost" size="sm" className="rounded-xl" onClick={() => setSelectedList(null)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9" onClick={() => shareListPlaces(list)}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="text-4xl mb-3">{list.icon}</div>
            <h1 className="text-2xl font-sans font-bold text-foreground">{list.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">{list.places?.length || 0} places</p>
          </motion.div>

          <Dialog open={addPlaceOpen} onOpenChange={setAddPlaceOpen}>
            <DialogTrigger asChild>
              <Button className="w-full rounded-2xl h-12 mb-6" variant="outline">
                <Plus className="h-4 w-4 mr-2" /> Add a place
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Add a place</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-sm">Name</Label>
                  <Input value={newPlace.name} onChange={e => setNewPlace(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Best café in Lisbon" className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Address (optional)</Label>
                  <Input value={newPlace.address} onChange={e => setNewPlace(p => ({ ...p, address: e.target.value }))} placeholder="e.g. Rua Augusta 23" className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Notes (optional)</Label>
                  <Input value={newPlace.description} onChange={e => setNewPlace(p => ({ ...p, description: e.target.value }))} placeholder="Quick notes..." className="rounded-xl mt-1" />
                </div>
                <Button onClick={addPlace} disabled={!newPlace.name.trim()} className="w-full rounded-2xl h-11">
                  Save Place
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <AnimatePresence>
            {list.places?.map((place, i) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.04 }}
              >
                <Card className="mb-3 rounded-2xl border-border/40 hover:shadow-md transition-all">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm">{place.name}</h3>
                      {place.address && <p className="text-xs text-muted-foreground mt-0.5">{place.address}</p>}
                      {place.description && <p className="text-xs text-muted-foreground mt-1">{place.description}</p>}
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs rounded-xl capitalize">{place.category}</Badge>
                        {place.rating && (
                          <div className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Star className="h-3 w-3 fill-chart-1 text-chart-1" />
                            {place.rating}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0" onClick={() => deletePlace(place.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {(!list.places || list.places.length === 0) && (
            <div className="text-center py-16 text-muted-foreground">
              <BookmarkPlus className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium">No places yet</p>
              <p className="text-sm mt-1">Add your first place to this list.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <Link to="/explore" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            <span className="font-bold text-lg tracking-tight">My Lists</span>
          </Link>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="rounded-xl">
                <Plus className="h-4 w-4 mr-1" /> New List
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle>Create a new list</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div>
                  <Label className="text-sm">Name</Label>
                  <Input value={newListName} onChange={e => setNewListName(e.target.value)} placeholder="e.g. Best cafés in Lisbon" className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-sm">Icon</Label>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {icons.map(icon => (
                      <button
                        key={icon}
                        onClick={() => setNewListIcon(icon)}
                        className={`w-10 h-10 rounded-2xl text-lg flex items-center justify-center transition-all ${
                          newListIcon === icon ? 'bg-primary/10 ring-2 ring-primary' : 'bg-secondary hover:bg-secondary/80'
                        }`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={createList} disabled={!newListName.trim()} className="w-full rounded-2xl h-11">
                  Create List
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Search */}
        {lists.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search lists..."
                className="pl-10 rounded-2xl h-12 bg-card border-border/50"
              />
            </div>
          </motion.div>
        )}

        {/* Lists grid */}
        <div className="grid gap-3">
          <AnimatePresence>
            {filteredLists.map((list, i) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="rounded-2xl border-border/40 cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5"
                  onClick={() => setSelectedList(list)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl shrink-0">
                      {list.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm">{list.name}</h3>
                      <p className="text-xs text-muted-foreground">{list.places?.length || 0} places</p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl">
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); shareListPlaces(list); }}>
                          <Share2 className="h-4 w-4 mr-2" /> Share
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={e => { e.stopPropagation(); deleteList(list.id); }} className="text-destructive">
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {lists.length === 0 && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-primary/10 flex items-center justify-center shadow-lg">
              <BookmarkPlus className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-sans font-bold text-foreground mb-2">No lists yet</h2>
            <p className="text-muted-foreground text-sm mb-6">Save places into lists to access them anytime, even offline.</p>
            <Button onClick={() => setDialogOpen(true)} className="rounded-2xl h-11 px-6">
              <Plus className="h-4 w-4 mr-1.5" /> Create your first list
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
