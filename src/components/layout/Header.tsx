import { Compass, Moon, Sun, LogOut, User, BookmarkPlus, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Header() {
  const [isDark, setIsDark] = useState(false);
  const { user, signOut } = useAuth();

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains('dark');
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
  };

  return (
    <header className="h-14 border-b border-border/40 bg-card/80 backdrop-blur-xl flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-primary flex items-center justify-center shadow-sm">
            <Compass className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">nomaaad</h1>
        </Link>
      </div>

      <div className="flex items-center gap-1.5">
        <Button asChild variant="ghost" size="sm" className="hidden sm:flex">
          <Link to="/lists">
            <BookmarkPlus className="h-4 w-4 mr-1.5" />
            Lists
          </Link>
        </Button>

        <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-9 w-9">
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
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
                  <BookmarkPlus className="h-4 w-4 mr-2" />
                  My Lists
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
}
