import { PlayerSearch } from '@/components/features/PlayerSearch';

export default function Players() {
  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Player Directory</h1>
          <p className="text-muted-foreground">
            Search for players, view their profiles, and track their achievements on AmzCraft.
          </p>
        </div>
        
        <PlayerSearch />
      </div>
    </main>
  );
}