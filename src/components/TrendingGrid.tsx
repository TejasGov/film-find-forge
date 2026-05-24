import { useState } from "react";
import type { Movie } from "@/types/movie";

interface TrendingGridProps {
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
  title?: string;
}

export const TrendingGrid = ({ movies, onMovieClick, title = "Trending Now" }: TrendingGridProps) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="mb-16">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-3 animate-fade-in">
        <span className="w-1 h-5 bg-primary rounded-full" />
        {title}
      </h3>
      <div
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3"
        style={{ perspective: "1000px" }}
      >
        {movies.map((movie) => (
          <div
            key={movie.imdbID}
            className="cursor-pointer"
            onMouseEnter={() => setHoveredId(movie.imdbID)}
            onMouseLeave={() => setHoveredId(null)}
            onClick={() => onMovieClick(movie)}
          >
            <div
              className="relative overflow-hidden rounded-xl shadow-card transition-all duration-300"
              style={{
                aspectRatio: "2/3",
                transform:
                  hoveredId === movie.imdbID
                    ? "rotateY(-12deg) rotateX(8deg) scale(1.08)"
                    : "rotateY(0) rotateX(0) scale(1)",
                opacity: hoveredId !== null && hoveredId !== movie.imdbID ? 0.15 : 1,
                transformStyle: "preserve-3d",
                zIndex: hoveredId === movie.imdbID ? 10 : 1,
              }}
            >
              {movie.Poster && movie.Poster !== "N/A" ? (
                <img 
                  src={movie.Poster} 
                  alt={movie.Title} 
                  className="w-full h-full object-cover" 
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = "/placeholder.svg"; }}
                />
              ) : (
                <div className="w-full h-full bg-secondary flex items-center justify-center">
                  <span className="text-muted-foreground text-xs">No poster</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                <h4 className="font-bold text-white text-xs mb-1 line-clamp-2 leading-tight">
                  {movie.Title}
                </h4>
                <p className="text-[11px] text-white/60">
                  {movie.Year} · {movie.imdbRating}/10
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
