import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { fetchMovieById } from "@/services/omdb";
import type { Movie } from "@/types/movie";

const KEY = "watchlist";
const EVT = "watchlist-change";
const readIds = (): string[] => JSON.parse(localStorage.getItem(KEY) || "[]");
const writeIds = (ids: string[]) => {
  localStorage.setItem(KEY, JSON.stringify(ids));
  window.dispatchEvent(new Event(EVT));
};

export function useWatchlist() {
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [ids, setIds] = useState<string[]>(readIds);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const sync = () => setIds(readIds());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const addToWatchlist = (movie: Movie) => {
    const cur = readIds();
    if (cur.includes(movie.imdbID)) {
      toast({ title: "Already saved", description: `${movie.Title} is already on your list` });
      return;
    }
    writeIds([...cur, movie.imdbID]);
    toast({ title: "Saved to your list", description: movie.Title });
  };

  const loadWatchlist = async (known: Movie[] = []) => {
    setShowWatchlist(true);
    const byId = new Map(known.map((m) => [m.imdbID, m]));
    const movies = await Promise.all(readIds().map((id) => byId.get(id) ?? fetchMovieById(id)));
    setWatchlist(movies);
  };

  const removeFromWatchlist = (imdbID: string) => {
    writeIds(readIds().filter((id) => id !== imdbID));
    setWatchlist((prev) => prev.filter((m) => m.imdbID !== imdbID));
    toast({ title: "Removed from your list" });
  };

  return { watchlist, ids, showWatchlist, setShowWatchlist, addToWatchlist, loadWatchlist, removeFromWatchlist };
}
