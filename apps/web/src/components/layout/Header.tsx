import { Link } from 'react-router-dom';
import { Moon, Sun, User, LogOut, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export function Header() {
  const { user, login, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="border-b bg-card">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-primary">
          AmzCraft
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/news" className="hover:text-primary">News</Link>
          <Link to="/rules" className="hover:text-primary">Rules</Link>
          <Link to="/events" className="hover:text-primary">Events</Link>
          <Link to="/ranks" className="hover:text-primary">Ranks</Link>
          <Link to="/leaderboards/current" className="hover:text-primary">Leaderboards</Link>
        </nav>

        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {user ? (
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <Link to="/admin/dashboard">
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <span className="text-sm">{user.username}</span>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={login} size="sm">
              <User className="h-4 w-4 mr-2" />
              Login
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}