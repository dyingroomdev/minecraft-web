interface HealthItem {
  name: string;
  ok: boolean;
  latency_ms: number;
}

interface HealthListProps {
  items: HealthItem[];
}

export default function HealthList({ items }: HealthListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.name} className="flex items-center justify-between p-3 bg-surface2/50 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${item.ok ? 'bg-brand' : 'bg-minecraft-red'}`} />
            <span className="text-gray-200 capitalize">{item.name.replace('_', ' ')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-mono text-sm text-gray-300">
              {item.latency_ms}ms
            </span>
            <span className={`px-2 py-1 text-xs rounded ${
              item.ok ? 'bg-brand/20 text-brand' : 'bg-minecraft-red/20 text-minecraft-red'
            }`}>
              {item.ok ? 'OK' : 'FAIL'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}