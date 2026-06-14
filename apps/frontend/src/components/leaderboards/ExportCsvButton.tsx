import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toCsv } from '@/lib/leaderboards';

interface ExportCsvButtonProps {
  rows: Array<Record<string, unknown>>;
  columns: string[];
  filename: string;
  disabled?: boolean;
}

export function ExportCsvButton({ rows, columns, filename, disabled }: ExportCsvButtonProps) {
  const handleExport = () => {
    const csv = toCsv(rows, columns);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-2 border-stone-700"
      onClick={handleExport}
      disabled={disabled || rows.length === 0}
    >
      <Download className="h-4 w-4" />
      Export CSV
    </Button>
  );
}
