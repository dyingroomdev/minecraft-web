import { useState } from 'react';
import { Link2, Check } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface CopyLinkButtonProps {
  buildUrl: () => string;
}

export function CopyLinkButton({ buildUrl }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const url = buildUrl();
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link', error);
    }
  };

  return (
    <Button variant="outline" size="sm" className="gap-2 border-stone-700" onClick={handleCopy}>
      {copied ? <Check className="h-4 w-4" /> : <Link2 className="h-4 w-4" />}
      {copied ? 'Copied!' : 'Copy link'}
    </Button>
  );
}
