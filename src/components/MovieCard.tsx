import type { Movie } from "@/types/movie";
import { Star, Plus, Play, Trash2 } from "lucide-react";

interface MovieCardProps {
  movie: Movie;
  onAddToWatchlist: () => void;
  onViewTrailer: () => void;
  showRemove?: boolean;
  onRemove?: () => void;
}

export const MovieCard = ({
  movie,
  onAddToWatchlist,
  onViewTrailer,
  showRemove = false,
  onRemove,
}: MovieCardProps) => {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-card animate-scale-in group">
      <div className="flex flex-col md:flex-row">
        {/* Poster */}
        <div className="relative md:w-64 lg:w-72 shrink-0 overflow-hidden">
          <img
            src={movie.Poster !== "N/A" ? movie.Poster : "/placeholder.svg"}
            alt={movie.Title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            style={{ aspectRatio: "2/3" }}
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-card hidden md:block opacity-60" />
        </div>

        {/* Details */}
        <div className="flex-1 p-7 md:p-8 flex flex-col justify-between">
          <div>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-3 text-foreground leading-tight">
              {movie.Title}
            </h2>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-5">
              {movie.imdbRating !== "N/A" && (
                <span className="flex items-center gap-1.5 text-accent font-bold text-sm">
                  <Star className="w-4 h-4 fill-accent" />
                  {movie.imdbRating}
                </span>
              )}
              <span className="text-muted-foreground text-sm">{movie.Year}</span>
              {movie.Runtime !== "N/A" && (
                <span className="text-muted-foreground text-sm">{movie.Runtime}</span>
              )}
              {movie.Rated !== "N/A" && (
                <span className="text-xs border border-border text-muted-foreground px-2 py-0.5 rounded">
                  {movie.Rated}
                </span>
              )}
            </div>

            {/* Genres */}
            <div className="flex flex-wrap gap-2 mb-5">
              {movie.Genre.split(", ").map((g) => (
                <span key={g} className="text-xs bg-secondary text-muted-foreground px-3 py-1 rounded-full">
                  {g}
                </span>
              ))}
            </div>

            {/* Plot */}
            <p className="text-sm text-muted-foreground leading-relaxed mb-5">{movie.Plot}</p>

            {/* Cast */}
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground/60 font-medium">Cast </span>
              {movie.Actors}
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 mt-7">
            <button
              onClick={onViewTrailer}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-full transition-all shadow-glow"
            >
              <Play className="w-4 h-4 fill-current" />
              Watch Trailer
            </button>
            {showRemove ? (
              <button
                onClick={onRemove}
                className="flex items-center gap-2 bg-transparent hover:bg-destructive/10 text-destructive font-medium text-sm px-6 py-2.5 rounded-full border border-destructive/20 hover:border-destructive/40 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Remove
              </button>
            ) : (
              <button
                onClick={onAddToWatchlist}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-foreground font-medium text-sm px-6 py-2.5 rounded-full border border-white/10 hover:border-white/20 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add to List
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
