import { X, Play, Plus, Trash2 } from "lucide-react";
import type { Movie } from "@/types/movie";

interface Props {
  movie: Movie;
  onClose: () => void;
  onTrailer: () => void;
  onAdd?: () => void;
  onRemove?: () => void;
}

export const MovieSheet = ({ movie, onClose, onTrailer, onAdd, onRemove }: Props) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
    <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
    <div
      onClick={(e) => e.stopPropagation()}
      className="relative grid w-full max-w-4xl overflow-hidden rounded-2xl border border-border bg-card shadow-poster animate-in zoom-in-95 slide-in-from-bottom-4 duration-500 md:grid-cols-[300px_1fr]"
    >
      <img src={movie.Poster} alt={movie.Title} className="hidden h-full w-full object-cover md:block" />
      <div className="flex flex-col p-8 md:p-10">
        <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <p className="text-[11px] uppercase tracking-[0.25em] text-primary">
          {movie.Year} · {movie.Runtime} · {movie.Rated}
        </p>
        <h2 className="mt-3 font-display text-5xl leading-[0.95] text-foreground">{movie.Title}</h2>
        <p className="mt-4 text-sm text-muted-foreground">{movie.Genre}</p>
        <p className="mt-6 max-w-prose text-[15px] leading-relaxed text-foreground/85">{movie.Plot}</p>
        <dl className="mt-6 space-y-1 text-sm">
          <div className="flex gap-3"><dt className="w-16 text-muted-foreground">Rating</dt><dd>★ {movie.imdbRating} / 10</dd></div>
          <div className="flex gap-3"><dt className="w-16 text-muted-foreground">Cast</dt><dd className="text-foreground/85">{movie.Actors}</dd></div>
        </dl>
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
