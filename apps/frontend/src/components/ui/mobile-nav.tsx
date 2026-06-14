import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from './button';

interface MobileNavProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileNav({ isOpen, onToggle }: MobileNavProps) {
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={onToggle}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-card border-b shadow-lg md:hidden">
          <nav className="flex flex-col p-4 space-y-2">
            <Link 
              to="/news" 
              className="py-2 px-3 rounded hover:bg-accent transition-colors"
              onClick={onToggle}
            >
              News
            </Link>
            <Link 
              to="/rules" 
              className="py-2 px-3 rounded hover:bg-accent transition-colors"
              onClick={onToggle}
            >
              Rules
            </Link>
            <Link 
              to="/events" 
              className="py-2 px-3 rounded hover:bg-accent transition-colors"
              onClick={onToggle}
            >
              Events
            </Link>
            <Link 
              to="/ranks" 
              className="py-2 px-3 rounded hover:bg-accent transition-colors"
              onClick={onToggle}
            >
              Ranks
            </Link>
            <Link 
              to="/leaderboards" 
              className="py-2 px-3 rounded hover:bg-accent transition-colors"
              onClick={onToggle}
            >
              Leaderboards
            </Link>
            <Link 
              to="/vote" 
              className="py-2 px-3 rounded hover:bg-accent transition-colors"
              onClick={onToggle}
            >
              Vote
            </Link>
          </nav>
        </div>
      )}
    </>
  );
}