import { useEffect, useState } from "react";
import { X, Play, Plus, Trash2 } from "lucide-react";
import type { Movie } from "@/types/movie";
import { fetchMovieById } from "@/services/omdb";

interface Props {
  movie: Movie;
  onClose: () => void;
  onTrailer: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

type Rating = { Source: string; Value: string };

const LABEL: Record<string, string> = {
  "Internet Movie Database": "IMDb",
  "Rotten Tomatoes": "Rotten Tomatoes",
  Metacritic: "Metacritic",
};

// Convert "8.8/10", "87%", "74/100" into a 0–100 score for the bar.
const toPct = (v: string) => {
  if (v.endsWith("%")) return parseFloat(v);
  const [a, b] = v.split("/").map(parseFloat);
  return b ? (a / b) * 100 : 0;
};

const ok = (v?: string) => v && v !== "N/A";

export const MovieSheet = ({ movie, onClose, onTrailer, onAdd, onRemove }: Props) => {
  const [ratings, setRatings] = useState<Rating[] | null>(null);
  const [votes, setVotes] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    setRatings(null);
    fetchMovieById(movie.imdbID)
      .then((d: Movie & { Ratings?: Rating[]; imdbVotes?: string }) => {
        if (!live) return;
        setRatings(d.Ratings?.length ? d.Ratings : ok(movie.imdbRating) ? [{ Source: "Internet Movie Database", Value: `${movie.imdbRating}/10` }] : []);
        setVotes(ok(d.imdbVotes) ? d.imdbVotes! : null);
      })
      .catch(() => live && setRatings(ok(movie.imdbRating) ? [{ Source: "Internet Movie Database", Value: `${movie.imdbRating}/10` }] : []));
    return () => { live = false; };
  }, [movie.imdbID, movie.imdbRating]);

  const meta = [movie.Year, movie.Runtime, movie.Rated].filter(ok).join(" · ");

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative grid max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-2xl border border-border bg-card shadow-poster animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 md:grid-cols-[300px_1fr]"
      >
        {ok(movie.Poster) && <img src={movie.Poster} alt={movie.Title} className="hidden h-full w-full object-cover md:block" />}
        <div className="flex flex-col p-8 md:p-10">
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
          <p className="text-[11px] uppercase tracking-[0.25em] text-primary">{meta}</p>
          <h2 className="mt-3 pr-8 font-display text-5xl leading-[0.95] text-foreground">{movie.Title}</h2>
          {ok(movie.Genre) && <p className="mt-4 text-sm text-muted-foreground">{movie.Genre}</p>}
          {ok(movie.Plot) && <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-foreground/85">{movie.Plot}</p>}

          <div className="mt-7">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Critics & audiences</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {ratings === null
                ? [0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse border border-border bg-secondary/40" />)
                : ratings.length === 0
                ? <p className="text-sm text-muted-foreground">No ratings published yet.</p>
                : ratings.map((r) => (
                    <div key={r.Source} className="border border-border px-3 py-2.5">
                      <p className="text-[11px] text-muted-foreground">{LABEL[r.Source] ?? r.Source}</p>
                      <p className="mt-0.5 font-display text-2xl leading-none text-foreground">{r.Value}</p>
                      <div className="mt-2 h-px w-full bg-border">
                        <div className="h-px bg-primary" style={{ width: `${Math.min(100, toPct(r.Value))}%` }} />
                      </div>
                    </div>
                  ))}
            </div>
            {votes && <p className="mt-2 text-[11px] text-muted-foreground">{votes} IMDb votes · via OMDb</p>}
          </div>

          {ok(movie.Actors) && (
            <p className="mt-6 text-sm"><span className="mr-3 text-muted-foreground">Cast</span><span className="text-foreground/85">{movie.Actors}</span></p>
          )}
          <div className="mt-auto flex flex-wrap gap-3 pt-8">
            <button onClick={onTrailer} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-110">
              <Play className="h-4 w-4 fill-current" /> Trailer
            </button>
            {onAdd && (
              <button onClick={onAdd} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm transition hover:bg-secondary">
                <Plus className="h-4 w-4" /> My list
              </button>
            )}
            {onRemove && (
              <button onClick={onRemove} className="inline-flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm text-destructive transition hover:bg-secondary">
                <Trash2 className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
