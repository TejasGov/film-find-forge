import { useState, useEffect } from "react";
import { SearchBar } from "@/components/SearchBar";
import { MovieCard } from "@/components/MovieCard";
import { TrailerModal } from "@/components/TrailerModal";
import { SuggestionsQuiz } from "@/components/SuggestionsQuiz";
import { TrendingGrid } from "@/components/TrendingGrid";
import { useToast } from "@/hooks/use-toast";
import { useWatchlist } from "@/hooks/use-watchlist";
import { useTrailer } from "@/hooks/use-trailer";
import { fetchMovieByTitle, fetchMoviesByTerms, searchMoviesLive } from "@/services/omdb";
import { getMovieSuggestions, getTrendingMovies } from "@/services/groq";
import { getUserLocation } from "@/services/location";
import { OMDB_API_KEY } from "@/lib/config";
import type { Movie } from "@/types/movie";

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [loadingTopMovies, setLoadingTopMovies] = useState(true);
  const [userLocation, setUserLocation] = useState("Hollywood");
  
  // Live Search States
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchingLoading, setIsSearchingLoading] = useState(false);
  const [showSuggestionsQuiz, setShowSuggestionsQuiz] = useState(false);
  const [suggestedMovies, setSuggestedMovies] = useState<Movie[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { toast } = useToast();
  const { watchlist, showWatchlist, setShowWatchlist, addToWatchlist, loadWatchlist, removeFromWatchlist } = useWatchlist();
  const { trailerModal, openTrailer, closeTrailer } = useTrailer();

  useEffect(() => {
    getUserLocation()
      .then((location) => {
        setUserLocation(location);
        return getTrendingMovies(location);
      })
      .then(titles => fetchMoviesByTerms(titles))
      .then(setTopMovies)
      .catch(() => {})
      .finally(() => setLoadingTopMovies(false));
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length > 2) {
        setIsSearching(true);
        setIsSearchingLoading(true);
        setCurrentMovie(null); // Close detail view if open
        setShowWatchlist(false);
        try {
          const results = await searchMoviesLive(searchQuery);
          setSearchResults(results);
        } catch {
          setSearchResults([]);
        } finally {
          setIsSearchingLoading(false);
        }
      } else {
        setIsSearching(false);
        setSearchResults([]);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchMovie = async () => {
    if (!searchQuery.trim()) {
      toast({ title: "Please enter a movie title", variant: "destructive" });
      return;
    }
    try {
      const movie = await fetchMovieByTitle(searchQuery);
      if (movie) {
        setCurrentMovie(movie);
        setShowWatchlist(false);
      } else {
        toast({ title: "Movie not found", description: "Please try a different title", variant: "destructive" });
        setCurrentMovie(null);
      }
    } catch {
      toast({ title: "Error fetching movie", description: "Please check your API key and try again", variant: "destructive" });
    }
  };

  const handleSuggestionsSubmit = async (answers: Record<string, string>) => {
    setShowSuggestionsQuiz(false);
    setShowWatchlist(false);
    setCurrentMovie(null);
    try {
      const titles = await getMovieSuggestions(answers);
      const movies: Movie[] = [];
      for (const title of titles) {
        const movie = await fetchMovieByTitle(title);
        if (movie && movie.Poster !== "N/A") movies.push(movie);
      }
      setSuggestedMovies(movies);
      setShowSuggestions(true);
    } catch {
      toast({ title: "Error", description: "Could not fetch suggestions", variant: "destructive" });
    }
  };

  const goHome = () => {
    setCurrentMovie(null);
    setShowWatchlist(false);
    setShowSuggestions(false);
    setSearchQuery("");
    setIsSearching(false);
  };

  const showHome = !showWatchlist && !currentMovie && !showSuggestions && !isSearching;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-white/5">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-0.5 cursor-pointer select-none" onClick={goHome}>
              <span className="text-2xl font-black text-primary tracking-tight">CINE</span>
              <span className="text-2xl font-black text-foreground tracking-tight">SEARCH</span>
            </div>
            <nav className="flex items-center gap-6">
              <button
                onClick={goHome}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Home
              </button>
              <button
                onClick={() => setShowSuggestionsQuiz(true)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Suggestions
              </button>
              <button
                onClick={() => { setCurrentMovie(null); loadWatchlist(); }}
                className="text-sm font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-5 py-2 rounded-full transition-all"
              >
                My List
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className={`relative text-center px-6 transition-all duration-500 overflow-hidden ${isSearching ? 'py-8' : 'py-24'}`}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, hsla(0,87%,46%,0.09) 0%, transparent 65%)" }}
        />
        
        <div className={`transition-all duration-500 ${isSearching ? 'opacity-0 h-0 overflow-hidden scale-95' : 'opacity-100 scale-100 mb-10'}`}>
          <h2 className="relative text-6xl md:text-7xl font-black tracking-tight mb-4 leading-tight">
            Find Your Next{" "}
            <span className="text-primary">Obsession</span>
          </h2>
          <p className="relative text-base text-muted-foreground">
            Search millions of movies, series, and dramas
          </p>
        </div>

        <div className="relative">
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={searchMovie}
          />
        </div>
      </section>

      {/* Content */}
      <div className="container mx-auto px-6 pb-20">
        {isSearching && !currentMovie && (
          <div className="animate-fade-in">
            {isSearchingLoading ? (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-sm">Searching...</p>
              </div>
            ) : searchResults.length > 0 ? (
              <TrendingGrid
                title={`Search Results for "${searchQuery}"`}
                movies={searchResults}
                onMovieClick={(movie) => { setCurrentMovie(movie); setIsSearching(false); }}
              />
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-sm">No results found for "{searchQuery}"</p>
              </div>
            )}
          </div>
        )}

        {showHome && topMovies.length > 0 && (
          <TrendingGrid
            title={`Trending Now in ${userLocation}`}
            movies={topMovies}
            onMovieClick={(movie) => { setCurrentMovie(movie); setShowWatchlist(false); }}
          />
        )}
        {showHome && loadingTopMovies && (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">Loading trending movies...</p>
          </div>
        )}

        {!showWatchlist && currentMovie && (
          <div className="max-w-5xl mx-auto animate-fade-in">
            <MovieCard
              movie={currentMovie}
              onAddToWatchlist={() => addToWatchlist(currentMovie)}
              onViewTrailer={() => openTrailer(currentMovie.Title)}
            />
          </div>
        )}

        {showWatchlist && watchlist.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 animate-fade-in">
              <span className="w-1 h-5 bg-primary rounded-full" />
              My List
            </h2>
            <div className="grid gap-4 max-w-5xl mx-auto">
              {watchlist.map((movie) => (
                <MovieCard
                  key={movie.imdbID}
                  movie={movie}
                  onAddToWatchlist={() => {}}
                  onViewTrailer={() => openTrailer(movie.Title)}
                  showRemove
                  onRemove={() => removeFromWatchlist(movie.imdbID)}
                />
              ))}
            </div>
          </div>
        )}

        {showSuggestions && suggestedMovies.length > 0 && (
          <div>
            <h2 className="text-xl font-bold mb-8 flex items-center gap-3 animate-fade-in">
              <span className="w-1 h-5 bg-primary rounded-full" />
              Recommended for You
            </h2>
            <div className="grid gap-4 max-w-5xl mx-auto">
              {suggestedMovies.map((movie) => (
                <MovieCard
                  key={movie.imdbID}
                  movie={movie}
                  onAddToWatchlist={() => addToWatchlist(movie)}
                  onViewTrailer={() => openTrailer(movie.Title)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <TrailerModal
        isOpen={trailerModal.isOpen}
        onClose={closeTrailer}
        videoId={trailerModal.videoId}
        movieTitle={trailerModal.movieTitle}
        fallbackUrl={trailerModal.fallbackUrl}
      />

      {showSuggestionsQuiz && (
        <SuggestionsQuiz
          onClose={() => setShowSuggestionsQuiz(false)}
          onSubmit={handleSuggestionsSubmit}
        />
      )}
    </div>
  );
};

export default Index;
