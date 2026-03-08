import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search, MapPin, Plus, Check, Compass, Moon, Sun, LogOut, User,
  BookmarkPlus, Star, Coffee, Utensils, Camera, Wifi, Home, TreePine,
  ChevronRight, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from '@/hooks/use-toast';

interface CuratedPlace {
  id: string;
  name: string;
  city: string;
  country: string;
  description: string;
  category: string;
  image: string;
  rating: number;
  tags: string[];
}

const CURATED_PLACES: CuratedPlace[] = [
  { id: '1', name: 'Dojo Bali', city: 'Canggu', country: 'Indonesia', description: 'Iconic coworking space with pool and tropical vibes', category: 'coworking', image: 'photo-1537996194471-e657df975ab4', rating: 4.7, tags: ['wifi', 'pool', 'community'] },
  { id: '2', name: 'Selina Lisbon', city: 'Lisbon', country: 'Portugal', description: 'Coliving and coworking in the heart of the city', category: 'coliving', image: 'photo-1536663815808-535e2280d2c2', rating: 4.5, tags: ['coliving', 'events', 'rooftop'] },
  { id: '3', name: 'Café de Flore', city: 'Paris', country: 'France', description: 'Legendary café with literary history and strong espresso', category: 'cafe', image: 'photo-1502602898657-3e91760cbb34', rating: 4.3, tags: ['historic', 'coffee', 'ambiance'] },
  { id: '4', name: 'Punspace', city: 'Chiang Mai', country: 'Thailand', description: 'Popular coworking space loved by digital nomads', category: 'coworking', image: 'photo-1506665531195-3566af2b4dfa', rating: 4.6, tags: ['wifi', 'affordable', 'community'] },
  { id: '5', name: 'La Boqueria', city: 'Barcelona', country: 'Spain', description: 'Vibrant food market with fresh local produce and tapas', category: 'food', image: 'photo-1539037116277-4db20889f2d4', rating: 4.8, tags: ['food', 'market', 'local'] },
  { id: '6', name: 'Ubud Rice Terraces', city: 'Ubud', country: 'Indonesia', description: 'UNESCO World Heritage rice paddies with stunning views', category: 'explore', image: 'photo-1555400038-63f5ba517a47', rating: 4.9, tags: ['nature', 'views', 'hiking'] },
  { id: '7', name: 'Outsite Lisbon', city: 'Lisbon', country: 'Portugal', description: 'Premium coliving space with ocean views', category: 'coliving', image: 'photo-1555881400-74d7acaacd8b', rating: 4.4, tags: ['ocean', 'modern', 'community'] },
  { id: '8', name: 'Taco Stand El Califa', city: 'Mexico City', country: 'Mexico', description: 'Legendary street tacos in the heart of CDMX', category: 'food', image: 'photo-1504544750208-dc0358e63f7f', rating: 4.7, tags: ['street food', 'authentic', 'cheap'] },
  { id: '9', name: 'KoHub', city: 'Koh Lanta', country: 'Thailand', description: 'Island coworking with beach access and sunsets', category: 'coworking', image: 'photo-1519451241324-20b4ea2c4220', rating: 4.5, tags: ['beach', 'island', 'wifi'] },
  { id: '10', name: 'Fushimi Inari Shrine', city: 'Kyoto', country: 'Japan', description: 'Thousands of vermillion torii gates up a mountain', category: 'explore', image: 'photo-1493976040374-85c8e12f0c0e', rating: 4.9, tags: ['temple', 'hiking', 'iconic'] },
  { id: '11', name: 'Hostel One Paralelo', city: 'Barcelona', country: 'Spain', description: 'Top-rated social hostel with free dinner and events', category: 'hostel', image: 'photo-1555854877-bab0e564b8d5', rating: 4.8, tags: ['social', 'events', 'budget'] },
  { id: '12', name: 'Café Saigon', city: 'Ho Chi Minh City', country: 'Vietnam', description: 'Vietnamese drip coffee in a colonial-era building', category: 'cafe', image: 'photo-1528127269322-539801943592', rating: 4.4, tags: ['coffee', 'wifi', 'cheap'] },
  { id: '13', name: 'Table Mountain', city: 'Cape Town', country: 'South Africa', description: 'Flat-topped mountain with panoramic city and ocean views', category: 'explore', image: 'photo-1580060839134-75a5edca2e99', rating: 4.9, tags: ['views', 'hiking', 'iconic'] },
  { id: '14', name: 'Cinta Cafe', city: 'Canggu', country: 'Indonesia', description: 'Trendy beachfront café with healthy bowls and sunset views', category: 'cafe', image: 'photo-1544551763-46a013bb70d5', rating: 4.3, tags: ['healthy', 'beach', 'wifi'] },
  { id: '15', name: 'Riad Yasmine', city: 'Marrakech', country: 'Morocco', description: 'Beautiful traditional riad with a pool in the medina', category: 'hostel', image: 'photo-1539020140153-e479b8c22e70', rating: 4.6, tags: ['traditional', 'pool', 'photogenic'] },
  { id: '16', name: 'Medellín Coworking', city: 'Medellín', country: 'Colombia', description: 'Modern workspace in El Poblado with fast internet', category: 'coworking', image: 'photo-1526392060635-9d6019884377', rating: 4.5, tags: ['wifi', 'modern', 'community'] },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Compass },
  { id: 'coworking', label: 'Coworking', icon: Wifi },
  { id: 'cafe', label: 'Cafés', icon: Coffee },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'explore', label: 'Explore', icon: Camera },
  { id: 'hostel', label: 'Hostels', icon: Home },
  { id: 'coliving', label: 'Coliving', icon: TreePine },
];

interface SavedListOption {
  id: string;
  name: string;
  icon: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function Explore() {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [isDark, setIsDark] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<CuratedPlace | null>(null);
  const [lists, setLists] = useState<SavedListOption[]>([]);
  const [addedToList, setAddedToList] = useState<Record<string, string[]>>({});

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  const fetchLists = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('saved_lists')
      .select('id, name, icon')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setLists(data as SavedListOption[]);
  }, [user]);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  const handleAddToList = async (listId: string) => {
    if (!user || !selectedPlace) return;
    const { error } = await supabase.from('saved_places').insert({
      list_id: listId,
      user_id: user.id,
      name: selectedPlace.name,
      description: selectedPlace.description,
      address: `${selectedPlace.city}, ${selectedPlace.country}`,
      category: selectedPlace.category,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }
    setAddedToList(prev => ({
      ...prev,
      [selectedPlace.id]: [...(prev[selectedPlace.id] || []), listId],
    }));
    toast({ title: `Added to list` });
    setAddDialogOpen(false);
    setSelectedPlace(null);
  };

  const openAddDialog = (place: CuratedPlace) => {
    setSelectedPlace(place);
    setAddDialogOpen(true);
  };

  const filtered = CURATED_PLACES.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.city.toLowerCase().includes(search.toLowerCase()) ||
      p.country.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === 'all' || p.category === category;
    return matchSearch && matchCategory;
  });

  const mascotEmoji = profile?.mascot === 'panda' ? '🐼' : profile?.mascot === 'cat' ? '🐱' : profile?.mascot === 'dog' ? '🐶' : '👋';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 backdrop-blur-xl bg-background/70 border-b border-border/40"
      >
        <div className="flex items-center justify-between px-4 py-3 max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
              <Compass className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">nomaaad</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <Link to="/lists"><BookmarkPlus className="h-4 w-4" /></Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9 rounded-xl">
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-2xl w-56">
                  <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/lists" className="cursor-pointer">
                      <BookmarkPlus className="h-4 w-4 mr-2" /> My Lists
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </motion.nav>

      <div className="max-w-2xl mx-auto px-4">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="pt-8 pb-6"
        >
          <h1 className="text-2xl font-serif font-bold text-foreground">
            {mascotEmoji} Hey, explorer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Discover curated places from around the world.
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search places, cities..."
              className="pl-10 rounded-2xl h-12 bg-card border-border/50"
            />
          </div>
        </motion.div>

        {/* Category pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4"
        >
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium whitespace-nowrap transition-all ${
                category === cat.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <cat.icon className="h-3.5 w-3.5" />
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Places grid */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          className="grid gap-4 pt-2"
        >
          <AnimatePresence>
            {filtered.map(place => (
              <motion.div
                key={place.id}
                variants={fadeUp}
                transition={{ duration: 0.4 }}
                layout
              >
                <Card className="rounded-3xl border-border/40 overflow-hidden hover:shadow-lg transition-all group">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <img
                      src={`https://images.unsplash.com/${place.image}?auto=format&fit=crop&w=800&q=80`}
                      alt={place.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute top-3 right-3">
                      <button
                        onClick={() => openAddDialog(place)}
                        className="w-10 h-10 rounded-2xl bg-background/90 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-background transition-colors"
                      >
                        <Plus className="h-5 w-5 text-foreground" />
                      </button>
                    </div>
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                      <Badge variant="secondary" className="rounded-xl bg-background/80 backdrop-blur-md text-foreground text-xs">
                        <MapPin className="h-3 w-3 mr-1" />
                        {place.city}
                      </Badge>
                      <Badge variant="secondary" className="rounded-xl bg-background/80 backdrop-blur-md text-foreground text-xs">
                        <Star className="h-3 w-3 mr-1 fill-chart-1 text-chart-1" />
                        {place.rating}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-foreground">{place.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{place.description}</p>
                    <div className="flex gap-1.5 mt-3 flex-wrap">
                      {place.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="rounded-xl text-xs capitalize">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="font-medium">No places found</p>
              <p className="text-sm mt-1">Try a different search or category.</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add to list dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="rounded-3xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg">Save to list</DialogTitle>
          </DialogHeader>
          {selectedPlace && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-secondary/50">
                <MapPin className="h-4 w-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{selectedPlace.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedPlace.city}, {selectedPlace.country}</p>
                </div>
              </div>

              {lists.length === 0 ? (
                <div className="text-center py-6">
                  <BookmarkPlus className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground mb-3">No lists yet</p>
                  <Button asChild variant="outline" className="rounded-2xl" size="sm">
                    <Link to="/lists" onClick={() => setAddDialogOpen(false)}>
                      Create a list <ChevronRight className="h-3 w-3 ml-1" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {lists.map(list => {
                    const alreadyAdded = addedToList[selectedPlace.id]?.includes(list.id);
                    return (
                      <button
                        key={list.id}
                        onClick={() => !alreadyAdded && handleAddToList(list.id)}
                        disabled={alreadyAdded}
                        className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                          alreadyAdded
                            ? 'bg-primary/5 border border-primary/20'
                            : 'bg-card border border-border/50 hover:border-primary/30 hover:bg-card/80'
                        }`}
                      >
                        <span className="text-xl">{list.icon}</span>
                        <span className="flex-1 font-medium text-sm">{list.name}</span>
                        {alreadyAdded && <Check className="h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-xl border-t border-border/40 md:hidden safe-area-pb">
        <div className="flex items-center justify-around py-2 px-3">
          <Button variant="ghost" size="sm" className="flex-1 flex flex-col items-center gap-0.5 h-auto py-2 rounded-2xl bg-primary/10">
            <Compass className="h-5 w-5 text-primary" />
            <span className="text-[10px] text-primary font-semibold">Explore</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 flex flex-col items-center gap-0.5 h-auto py-2 rounded-2xl" asChild>
            <Link to="/destinations">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Destinations</span>
            </Link>
          </Button>
          <Button variant="ghost" size="sm" className="flex-1 flex flex-col items-center gap-0.5 h-auto py-2 rounded-2xl" asChild>
            <Link to="/lists">
              <BookmarkPlus className="h-5 w-5 text-muted-foreground" />
              <span className="text-[10px] text-muted-foreground">Lists</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
