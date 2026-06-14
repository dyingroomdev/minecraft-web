export function Navbar() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-bg/70 border-b border-white/10">
      <nav className="mx-auto max-w-[1200px] px-6 h-14 flex items-center justify-between">
        <a href="/" className="font-display font-extrabold text-lg">AmzCraft</a>
        <ul className="hidden md:flex gap-6 text-sm">
          <li><a href="/news" className="hover:text-brand">News</a></li>
          <li><a href="/rules" className="hover:text-brand">Rules</a></li>
          <li><a href="/events" className="hover:text-brand">Events</a></li>
          <li><a href="/ranks" className="hover:text-brand">Ranks</a></li>
          <li><a href="/leaderboards" className="hover:text-brand">Leaderboards</a></li>
          <li><a href="/vote" className="hover:text-brand">Vote</a></li>
        </ul>
        <a href="/login" className="rounded-xl bg-brand/90 text-bg px-4 py-1.5 font-semibold hover:bg-brand">Login</a>
      </nav>
    </header>
  );
}
