interface KpiTileProps {
  label: string;
  value: string | number;
  status?: 'ok' | 'warn' | 'err';
  suffix?: string;
}

export default function KpiTile({ label, value, status = 'ok', suffix }: KpiTileProps) {
  const statusColors = {
    ok: 'border-brand/30 bg-brand/10',
    warn: 'border-accent/30 bg-accent/10',
    err: 'border-minecraft-red/30 bg-minecraft-red/10'
  };

  const valueColors = {
    ok: 'text-brand',
    warn: 'text-accent',
    err: 'text-minecraft-red'
  };

  return (
    <div className={`p-4 rounded-2xl border backdrop-blur-sm shadow-card ${statusColors[status]} ${status === 'warn' ? 'animate-pulse' : ''}`}>
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-mono font-bold ${valueColors[status]}`}>
        {value}{suffix && <span className="text-sm ml-1">{suffix}</span>}
      </p>
    </div>
  );
}