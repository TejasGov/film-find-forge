import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { PosterCanvas } from "@/components/PosterCanvas";
import { MovieSheet } from "@/components/MovieSheet";
import { MovieNight } from "@/components/MovieNight";
import { TrailerModal } from "@/components/TrailerModal";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useTrailer } from "@/hooks/use-trailer";
import { useLenis } from "@/hooks/use-lenis";
import { searchMoviesLive } from "@/services/omdb";
import allMovies from "@/data/movies.json";
import type { Movie } from "@/types/movie";

const MOVIES = allMovies as Movie[];

const Index = () => {
  const [selected, setSelected] = useState<Movie | null>(null);
  const [night, setNight] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Movie[]>([]);
  const [searching, setSearching] = useState(false);
  const { watchlist, showWatchlist, setShowWatchlist, addToWatchlist, loadWatchlist, removeFromWatchlist } = useWatchlist();
  const { trailerModal, openTrailer, closeTrailer } = useTrailer();

  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLenis(wrap, inner, searchOpen || showWatchlist);

  useEffect(() => {
    if (query.trim().length < 3) return setResults([]);
    setSearching(true);
    const t = setTimeout(() => {
      searchMoviesLive(query).then(setResults).catch(() => setResults([])).finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape") { setSearchOpen(false); setShowWatchlist(false); setSelected(null); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [setShowWatchlist]);

  const inList = watchlist.some((m) => m.imdbID === selected?.imdbID) && showWatchlist;
  const listOpen = showWatchlist;
  const grid = searchOpen ? results : watchlist;

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">CineSearch — explore 100 great films and decide what to watch together</h1>
      <PosterCanvas movies={MOVIES} onSelect={setSelected} />

      {/* Top bar */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between p-5 md:p-7">
        <div className="pointer-events-auto font-display text-2xl tracking-tight">
          Cine<span className="italic text-primary">search</span>
        </div>
        <nav className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/70 bg-background/60 p-1 backdrop-blur-xl">
          <button onClick={() => setSearchOpen(true)} className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground">
            <Search className="h-4 w-4" /> Search <kbd className="hidden rounded border border-border px-1.5 text-[10px] md:inline">⌘K</kbd>
          </button>
          <button onClick={loadWatchlist} className="rounded-full px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground">
            My list
          </button>
        </nav>
      </header>

      {/* Floating call to action */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center p-5 md:p-8">
        <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-border/70 bg-background/70 p-6 shadow-poster backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-6 duration-1000 md:p-7">
          <h2 className="font-display text-4xl leading-[1] md:text-5xl">
            Stop scrolling. <span className="italic text-primary">Start watching.</span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Everyone ranks five questions. We find the one film your whole group will love.
          </p>
          <div className="mt-5 flex items-center justify-between gap-4">
            <button onClick={() => setNight(true)} className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:brightness-110">
              Start movie night
            </button>
            <span className="text-xs text-muted-foreground">Drag to explore 100 films</span>
          </div>
        </div>
      </div>

      {/* Search & list overlay */}
      {(searchOpen || listOpen) && (
        <div className="fixed inset-0 z-50 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-background/90 backdrop-blur-2xl" onClick={() => { setSearchOpen(false); setShowWatchlist(false); }} />
          <div ref={wrap} className="relative h-full overflow-y-auto">
            <div ref={inner} className="mx-auto max-w-6xl px-6 py-8">
              <div className="flex items-center gap-4 border-b border-border pb-4">
                {searchOpen ? (
                  <>
                    <Search className="h-5 w-5 text-muted-foreground" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search any film…"
                      className="flex-1 bg-transparent font-display text-4xl outline-none placeholder:text-muted-foreground/40"
                    />
                  </>
                ) : (
                  <h2 className="flex-1 font-display text-4xl">My list</h2>
                )}
                <button onClick={() => { setSearchOpen(false); setShowWatchlist(false); }} aria-label="Close" className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {searchOpen && searching && <p className="mt-8 text-sm text-muted-foreground">Searching…</p>}
              {searchOpen && !searching && query.length >= 3 && results.length === 0 && (
                <p className="mt-8 text-sm text-muted-foreground">Nothing found for “{query}”.</p>
              )}
              <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
                {grid.map((m, i) => (
                  <button key={m.imdbID} onClick={() => setSelected(m)} className="group text-left animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${i * 40}ms`, animationFillMode: "both" }}>
                    <div className="overflow-hidden rounded-md ring-1 ring-border">
                      <img src={m.Poster} alt="" className="aspect-[2/3] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>
                    <p className="mt-2 font-display text-lg leading-tight">{m.Title}</p>
                    <p className="text-xs text-muted-foreground">{m.Year}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <MovieSheet
          movie={selected}
          onClose={() => setSelected(null)}
          onTrailer={() => openTrailer(selected.Title)}
          onAdd={inList ? undefined : () => addToWatchlist(selected)}
          onRemove={inList ? () => { removeFromWatchlist(selected.imdbID); setSelected(null); } : undefined}
        />
      )}

      {night && (
        <MovieNight movies={MOVIES} onClose={() => setNight(false)} onTrailer={(m) => openTrailer(m.Title)} onAdd={addToWatchlist} />
      )}

      <TrailerModal
        isOpen={trailerModal.isOpen}
        onClose={closeTrailer}
        videoId={trailerModal.videoId}
        movieTitle={trailerModal.movieTitle}
        fallbackUrl={trailerModal.fallbackUrl}
      />
    </main>
  );
};

export default Index;
