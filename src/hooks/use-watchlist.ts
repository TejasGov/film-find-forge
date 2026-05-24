import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchMovieById } from "@/services/omdb";
import type { Movie } from "@/types/movie";

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const { toast } = useToast();

  const addToWatchlist = (movie: Movie) => {
    const ids: string[] = JSON.parse(localStorage.getItem("watchlist") || "[]");
    if (ids.includes(movie.imdbID)) {
      toast({ title: "Already in watchlist", description: `${movie.Title} is already in your watchlist` });
      return;
    }
    localStorage.setItem("watchlist", JSON.stringify([...ids, movie.imdbID]));
    toast({ title: "Added to watchlist", description: `${movie.Title} has been added to your watchlist` });
  };

  const loadWatchlist = async () => {
    const ids: string[] = JSON.parse(localStorage.getItem("watchlist") || "[]");
    if (ids.length === 0) {
      toast({ title: "Watchlist is empty", description: "Start adding movies to your watchlist" });
      return;
    }
    const movies = await Promise.all(ids.map(fetchMovieById));
    setWatchlist(movies);
    setShowWatchlist(true);
  };

  const removeFromWatchlist = (imdbID: string) => {
    const ids: string[] = JSON.parse(localStorage.getItem("watchlist") || "[]");
    localStorage.setItem("watchlist", JSON.stringify(ids.filter((id) => id !== imdbID)));
    setWatchlist((prev) => prev.filter((m) => m.imdbID !== imdbID));
    toast({ title: "Removed from watchlist", description: "Movie has been removed from your watchlist" });
  };

  return { watchlist, showWatchlist, setShowWatchlist, addToWatchlist, loadWatchlist, removeFromWatchlist };
}
