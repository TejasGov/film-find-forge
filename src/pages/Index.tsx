import { useEffect, useRef, useState } from "react";
import { Search, X, Bookmark, ArrowRight } from "lucide-react";
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
  const { watchlist, ids, showWatchlist, setShowWatchlist, addToWatchlist, loadWatchlist, removeFromWatchlist } = useWatchlist();
  const { trailerModal, openTrailer, closeTrailer } = useTrailer();

  const wrap = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  useLenis(wrap, inner, searchOpen || showWatchlist);

  useEffect(() => {
    if (query.trim().length < 3) { setSearching(false); return setResults([]); }
    setSearching(true);
    const t = setTimeout(() => {
      searchMoviesLive(query).then(setResults).catch(() => setResults([])).finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setSearchOpen(true); }
      if (e.key === "Escape" && !document.querySelector("[role=dialog][data-state=open]")) { setSearchOpen(false); setShowWatchlist(false); setSelected(null); }
    };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [setShowWatchlist]);

  const inList = watchlist.some((m) => m.imdbID === selected?.imdbID) && showWatchlist;
  const listOpen = showWatchlist;
  const grid = searchOpen ? results : watchlist;
  const posterOf = new Map(MOVIES.map((m) => [m.imdbID, m.Poster]));
  const thumbs = ids.slice(-3).map((id) => posterOf.get(id)).filter(Boolean) as string[];

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <h1 className="sr-only">WhatToWatch Tonight — explore 100 great films and decide what to watch together</h1>
      <PosterCanvas movies={MOVIES} onSelect={setSelected} />

      {/* Top bar */}
      <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between p-5 md:px-8 md:py-6">
        <div className="pointer-events-auto flex items-baseline gap-3">
          <span className="font-display text-2xl tracking-tight">WhatToWatch <span className="italic text-primary">tonight</span>{/*
            */}
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground md:inline">Vol. 01 — {MOVIES.length} films</span>
        </div>
        <nav className="pointer-events-auto flex items-center gap-2">
          <button onClick={() => setSearchOpen(true)} className="inline-flex h-10 items-center gap-2.5 border border-foreground/15 bg-background/50 px-4 text-sm text-muted-foreground backdrop-blur-xl transition hover:border-foreground/40 hover:text-foreground">
            <Search className="h-3.5 w-3.5" /> Search
            <kbd className="hidden font-mono text-[10px] text-muted-foreground/70 md:inline">⌘K</kbd>
          </button>
          <button
            onClick={() => loadWatchlist(MOVIES)}
            className="group inline-flex h-10 items-center gap-3 border border-foreground/15 bg-background/50 pl-3 pr-4 backdrop-blur-xl transition hover:border-primary/60"
            aria-label={`My list, ${ids.length} saved`}
          >
            <span className="relative flex h-6 items-center">
              {thumbs.length ? (
                thumbs.map((t, i) => (
                  <img
                    key={t}
                    src={t}
                    alt=""
                    className="h-7 w-5 object-cover ring-1 ring-background transition-transform duration-300 group-hover:translate-x-0"
                    style={{ marginLeft: i ? -8 : 0, transform: `rotate(${(i - 1) * 6}deg)`, zIndex: i }}
                  />
                ))
              ) : (
                <Bookmark className="h-4 w-4 text-muted-foreground transition group-hover:text-primary" />
              )}
            </span>
            <span className="text-sm text-foreground">My list</span>
            <span className="min-w-[1.5rem] border-l border-foreground/15 pl-3 font-mono text-xs tabular-nums text-primary">
              {String(ids.length).padStart(2, "0")}
            </span>
          </button>
        </nav>
      </header>

      {/* Centered call to action */}
      <div className="pointer-events-none fixed inset-0 z-30 flex items-center justify-center p-5">
        <div className="pointer-events-auto relative w-full max-w-md border border-foreground/15 bg-background/75 px-8 pb-8 pt-7 text-center shadow-poster backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-1000">
          <span className="absolute -top-px left-1/2 h-px w-16 -translate-x-1/2 bg-primary" />
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Movie night · 5 questions</p>
          <h2 className="mt-4 font-display text-5xl leading-[0.95]">
            One film.<br />
            <span className="italic text-primary">Everyone agrees.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Each person ranks five questions. We weigh every answer and pick the film your whole group will love.
          </p>
          <button
            onClick={() => setNight(true)}
            className="group mt-7 inline-flex w-full items-center justify-between bg-primary px-5 py-3.5 text-sm font-medium text-primary-foreground transition hover:brightness-110"
          >
            Start the quiz
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">or drag to explore</p>
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
                  <h2 className="flex-1 font-display text-4xl">My list <span className="font-mono text-sm text-muted-foreground">{String(ids.length).padStart(2, "0")}</span></h2>
                )}
                <button onClick={() => { setSearchOpen(false); setShowWatchlist(false); }} aria-label="Close" className="rounded-full p-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              {searchOpen && searching && <p className="mt-8 text-sm text-muted-foreground">Searching…</p>}
              {searchOpen && !searching && query.length >= 3 && results.length === 0 && (
                <p className="mt-8 text-sm text-muted-foreground">Nothing found for “{query}”.</p>
              )}
              {!searchOpen && ids.length === 0 && (
                <p className="mt-10 max-w-sm text-sm text-muted-foreground">Nothing saved yet. Open any poster and choose “My list” to keep it here.</p>
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
