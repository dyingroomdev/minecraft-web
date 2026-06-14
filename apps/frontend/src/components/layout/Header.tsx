import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, User, LogOut, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { MobileNav } from '@/components/ui/mobile-nav';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export function Header() {
  const { user, login, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <header className="border-b bg-card sticky top-0 z-40 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between relative">
        <Link to="/" className="text-2xl font-bold text-primary hover:scale-105 transition-transform">
          AmzCraft
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/news" className="hover:text-primary transition-colors relative group">
            News
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
          <Link to="/rules" className="hover:text-primary transition-colors relative group">
            Rules
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
          <Link to="/events" className="hover:text-primary transition-colors relative group">
            Events
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
          <Link to="/ranks" className="hover:text-primary transition-colors relative group">
            Ranks
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
          <Link to="/leaderboards/current" className="hover:text-primary transition-colors relative group">
            Leaderboards
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
          <Link to="/vote" className="hover:text-primary transition-colors relative group">
            Vote
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full"></span>
          </Link>
        </nav>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="hover:scale-110 transition-transform"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {user ? (
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <Link to="/admin/dashboard">
                  <Button variant="ghost" size="sm" className="hover:scale-105 transition-transform">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <span className="text-sm font-medium">{user.username}</span>
              <Button variant="ghost" size="sm" onClick={logout} className="hover:scale-105 transition-transform">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={login} size="sm" className="hover:scale-105 transition-transform">
              <User className="h-4 w-4 mr-2" />
              Login
            </Button>
          )}
          
          <MobileNav 
            isOpen={mobileNavOpen} 
            onToggle={() => setMobileNavOpen(!mobileNavOpen)} 
          />
        </div>
      </div>
    </header>
  );
}
