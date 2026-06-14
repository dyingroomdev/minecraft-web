import { Search } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  iconOnly?: boolean;
}

export function SearchInput({ className, ...props }: SearchInputProps) {
  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
      <Input
        {...props}
        className={cn(
          'pl-10 bg-coal-900/40 border-stone-700 text-sm placeholder:text-muted-foreground',
          props.className,
        )}
      />
    </div>
  );
}
