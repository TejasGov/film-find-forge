import { Star, Clock, Calendar, Plus, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MovieCardProps {
  movie: {
    Title: string;
    Poster: string;
    imdbRating: string;
    Year: string;
    Rated: string;
    Runtime: string;
    Genre: string;
    Plot: string;
    Actors: string;
    imdbID: string;
  };
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
  onRemove
}: MovieCardProps) => {
  return (
    <Card className="overflow-hidden bg-gradient-card border-border shadow-card hover:shadow-glow transition-all duration-300 animate-scale-in group">
      <CardContent className="p-0">
        <div className="grid md:grid-cols-[300px,1fr] gap-6">
          {/* Poster */}
          <div className="relative overflow-hidden">
            <img
              src={movie.Poster !== "N/A" ? movie.Poster : "/placeholder.svg"}
              alt={movie.Title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          {/* Details */}
          <div className="p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-3 text-foreground">{movie.Title}</h2>
              
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {movie.imdbRating !== "N/A" && (
                  <div className="flex items-center gap-1 bg-accent/20 px-3 py-1 rounded-full">
                    <Star className="w-4 h-4 fill-accent text-accent" />
                    <span className="font-semibold text-accent">{movie.imdbRating}</span>
                  </div>
                )}
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {movie.Year}
                </Badge>
                {movie.Rated !== "N/A" && (
                  <Badge variant="outline">{movie.Rated}</Badge>
                )}
                {movie.Runtime !== "N/A" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {movie.Runtime}
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground mb-2">
                <span className="font-semibold text-foreground">Genre:</span> {movie.Genre}
              </p>

              <p className="text-foreground leading-relaxed mb-4">{movie.Plot}</p>

              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">Cast:</span> {movie.Actors}
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={onViewTrailer}
                className="flex-1 bg-primary hover:bg-primary/90 shadow-glow"
              >
                <Play className="w-4 h-4 mr-2" />
                View Trailer
              </Button>
              {showRemove ? (
                <Button
                  onClick={onRemove}
                  variant="destructive"
                  className="flex-1"
                >
                  Remove
                </Button>
              ) : (
                <Button
                  onClick={onAddToWatchlist}
                  variant="secondary"
                  className="flex-1 hover:bg-secondary/80"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Watchlist
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
