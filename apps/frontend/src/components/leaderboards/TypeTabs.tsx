import { cn } from '@/lib/utils';
import { emojiForIndex } from '@/lib/leaderboards';

interface TypeTabsProps {
  types: string[];
  active: string;
  onChange: (type: string) => void;
  className?: string;
}

export function TypeTabs({ types, active, onChange, className }: TypeTabsProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {types.map((type, index) => {
        const emoji = emojiForIndex(index);
        const isActive = type === active;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide transition',
              isActive
                ? 'border-lime-400 bg-lime-500 text-forest-900 shadow-lg'
                : 'border-stone-700 bg-coal-900/40 text-muted-foreground hover:border-lime-400/50',
            )}
          >
            <img src={emoji} alt="" className="h-5 w-5 object-contain" loading="lazy" />
            {type}
          </button>
        );
      })}
    </div>
  );
}
