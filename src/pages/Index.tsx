import { useState, useEffect } from "react";
import { Film, BookmarkCheck } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MovieCard } from "@/components/MovieCard";
import { TrailerModal } from "@/components/TrailerModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// API Keys - Replace with your own
const OMDB_API_KEY = "2d39236c";
const YOUTUBE_API_KEY = "AIzaSyBX3z4AqKkxQcb0cu2zJPysfBBpIFbDmb4";

interface Movie {
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
}

interface TopMoviesGridProps {
  movies: Movie[];
  onMovieClick: (movie: Movie) => void;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentMovie, setCurrentMovie] = useState<Movie | null>(null);
  const [watchlist, setWatchlist] = useState<Movie[]>([]);
  const [showWatchlist, setShowWatchlist] = useState(false);
  const [trailerModal, setTrailerModal] = useState({
    isOpen: false,
    videoId: null as string | null,
    movieTitle: "",
    fallbackUrl: undefined as string | undefined,
  });
  const [topMovies, setTopMovies] = useState<Movie[]>([]);
  const [region, setRegion] = useState<string>("hollywood");
  const [loadingTopMovies, setLoadingTopMovies] = useState(true);
  const { toast } = useToast();

  const regionSearchTerms: Record<string, string[]> = {
    bollywood: ["Kabali", "Bahubali", "3 Idiots", "Dangal", "PK", "Lagaan"],
    spanish: ["Pan's Labyrinth", "The Orphanage", "Parasite", "Almodovar", "Spanish cinema", "El Ministerio del Tiempo"],
    hollywood: ["Inception", "The Dark Knight", "Oppenheimer", "Dune", "Avatar", "Interstellar"],
  };

  useEffect(() => {
    const detectLocationAndFetchMovies = async () => {
      try {
        const geoResponse = await fetch("https://ipapi.co/json/");
        const geoData = await geoResponse.json();
        const country = geoData.country_code?.toUpperCase() || "US";
        console.log("Detected country:", country);

        let detectedRegion = "hollywood";
        if (["IN"].includes(country)) {
          detectedRegion = "bollywood";
        } else if (["ES", "MX", "AR", "CO", "PE", "CL"].includes(country)) {
          detectedRegion = "spanish";
        }

        console.log("Detected region:", detectedRegion);
        setRegion(detectedRegion);
        await fetchTopMoviesByRegion(detectedRegion);
      } catch (error) {
        console.error("Geolocation failed, defaulting to Hollywood:", error);
        setRegion("hollywood");
        await fetchTopMoviesByRegion("hollywood");
      }
    };

    detectLocationAndFetchMovies();
  }, []);

  const fetchTopMoviesByRegion = async (selectedRegion: string) => {
    setLoadingTopMovies(true);
    const searchTerms = regionSearchTerms[selectedRegion] || regionSearchTerms.hollywood;
    const movies: Movie[] = [];

    try {
      console.log("Fetching movies for region:", selectedRegion, "with terms:", searchTerms);
      for (const term of searchTerms) {
        if (movies.length >= 6) break;

        const response = await fetch(
          `https://www.omdbapi.com/?s=${encodeURIComponent(term)}&type=movie&apikey=${OMDB_API_KEY}`
        );
        const data = await response.json();
        console.log("Search results for", term, ":", data);

        if (data.Search && data.Search.length > 0) {
          const result = data.Search[0];
          const detailResponse = await fetch(
            `https://www.omdbapi.com/?i=${result.imdbID}&apikey=${OMDB_API_KEY}`
          );
          const detailData = await detailResponse.json();
          console.log("Movie details:", detailData.Title, "Poster:", detailData.Poster);
          if (detailData.Poster && detailData.Poster !== "N/A") {
            movies.push(detailData);
          }
        }
      }

      console.log("Final movies to display:", movies);
      setTopMovies(movies);
    } catch (error) {
      console.error("Error fetching top movies:", error);
    } finally {
      setLoadingTopMovies(false);
    }
  };

  const searchMovie = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Please enter a movie title",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(
        `https://www.omdbapi.com/?t=${encodeURIComponent(searchQuery)}&apikey=${OMDB_API_KEY}`
      );
      const data = await response.json();

      if (data.Response === "True") {
        setCurrentMovie(data);
        setShowWatchlist(false);
      } else {
        toast({
          title: "Movie not found",
          description: "Please try a different title",
          variant: "destructive",
        });
        setCurrentMovie(null);
      }
    } catch (error) {
      toast({
        title: "Error fetching movie",
        description: "Please check your API key and try again",
        variant: "destructive",
      });
    }
  };

  const addToWatchlist = () => {
    if (!currentMovie) return;

    const existingWatchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    
    if (existingWatchlist.includes(currentMovie.imdbID)) {
      toast({
        title: "Already in watchlist",
        description: `${currentMovie.Title} is already in your watchlist`,
      });
      return;
    }

    const updatedWatchlist = [...existingWatchlist, currentMovie.imdbID];
    localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
    
    toast({
      title: "Added to watchlist",
      description: `${currentMovie.Title} has been added to your watchlist`,
    });
  };

  const loadWatchlist = async () => {
    const watchlistIds = JSON.parse(localStorage.getItem("watchlist") || "[]");
    
    if (watchlistIds.length === 0) {
      toast({
        title: "Watchlist is empty",
        description: "Start adding movies to your watchlist",
      });
      return;
    }

    const movies = await Promise.all(
      watchlistIds.map(async (id: string) => {
        const response = await fetch(
          `https://www.omdbapi.com/?i=${id}&apikey=${OMDB_API_KEY}`
        );
        return response.json();
      })
    );

    setWatchlist(movies);
    setCurrentMovie(null);
    setShowWatchlist(true);
  };

  const removeFromWatchlist = (imdbID: string) => {
    const existingWatchlist = JSON.parse(localStorage.getItem("watchlist") || "[]");
    const updatedWatchlist = existingWatchlist.filter((id: string) => id !== imdbID);
    localStorage.setItem("watchlist", JSON.stringify(updatedWatchlist));
    
    setWatchlist(watchlist.filter(movie => movie.imdbID !== imdbID));
    
    toast({
      title: "Removed from watchlist",
      description: "Movie has been removed from your watchlist",
    });
  };

  const searchTrailer = async (movieTitle: string) => {
    try {
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=5&q=${encodeURIComponent(
          movieTitle + " official trailer"
        )}&type=video&key=${YOUTUBE_API_KEY}`
      );
      const searchData = await searchResponse.json();

      if (searchData.items && searchData.items.length > 0) {
        // Check each video for embeddability
        for (const item of searchData.items) {
          const videoId = item.id.videoId;
          const videoResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=status&id=${videoId}&key=${YOUTUBE_API_KEY}`
          );
          const videoData = await videoResponse.json();

          if (
            videoData.items &&
            videoData.items[0]?.status?.embeddable === true
          ) {
            setTrailerModal({
              isOpen: true,
              videoId,
              movieTitle,
              fallbackUrl: undefined,
            });
            return;
          }
        }

        // No embeddable video found, show fallback
        const fallbackVideoId = searchData.items[0].id.videoId;
        setTrailerModal({
          isOpen: true,
          videoId: null,
          movieTitle,
          fallbackUrl: `https://www.youtube.com/watch?v=${fallbackVideoId}`,
        });
      } else {
        toast({
          title: "Trailer not found",
          description: "No trailer available for this movie",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error loading trailer",
        description: "Please check your YouTube API key",
        variant: "destructive",
      });
    }
  };

  const handleTopMovieClick = (movie: Movie) => {
    setCurrentMovie(movie);
    setShowWatchlist(false);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Film className="w-8 h-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                CineSearch
              </h1>
            </div>
            <Button
              onClick={loadWatchlist}
              variant="secondary"
              className="hover:bg-secondary/80"
            >
              <BookmarkCheck className="w-5 h-5 mr-2" />
              My Watchlist
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Search Section */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-5xl font-bold mb-4 animate-fade-in">
              Discover Your Next{" "}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Favorite Movie
              </span>
            </h2>
            <p className="text-xl text-muted-foreground animate-slide-up">
              Search millions of movies, TV series, and dramas
            </p>
          </div>
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onSearch={searchMovie}
            apiKey={OMDB_API_KEY}
          />
        </div>

        {/* Top Movies Section */}
        {!showWatchlist && !currentMovie && topMovies.length > 0 && (
          <div className="mb-16">
            <h3 className="text-3xl font-bold mb-8 text-center animate-fade-in">
              Trending Now
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {topMovies.map((movie) => (
                <div
                  key={movie.imdbID}
                  className="group cursor-pointer transform transition-transform hover:scale-105"
                  onClick={() => handleTopMovieClick(movie)}
                >
                  <div className="relative overflow-hidden rounded-lg shadow-lg">
                    {movie.Poster && movie.Poster !== "N/A" ? (
                      <img
                        src={movie.Poster}
                        alt={movie.Title}
                        className="w-full h-80 object-cover group-hover:opacity-90 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-80 bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No poster</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                      <h4 className="font-bold text-white text-lg mb-1">
                        {movie.Title}
                      </h4>
                      <p className="text-sm text-gray-200">
                        {movie.Year} • {movie.imdbRating}/10
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {!showWatchlist && !currentMovie && loadingTopMovies && (
          <div className="mb-16 text-center">
            <p className="text-muted-foreground">Loading trending movies...</p>
          </div>
        )}

        {/* Results Section */}
        {!showWatchlist && currentMovie && (
          <div className="max-w-5xl mx-auto">
            <MovieCard
              movie={currentMovie}
              onAddToWatchlist={addToWatchlist}
              onViewTrailer={() => searchTrailer(currentMovie.Title)}
            />
          </div>
        )}

        {/* Watchlist Section */}
        {showWatchlist && watchlist.length > 0 && (
          <div>
            <h2 className="text-3xl font-bold mb-6 text-center animate-fade-in">
              My Watchlist
            </h2>
            <div className="grid gap-6 max-w-5xl mx-auto">
              {watchlist.map((movie) => (
                <MovieCard
                  key={movie.imdbID}
                  movie={movie}
                  onAddToWatchlist={() => {}}
                  onViewTrailer={() => searchTrailer(movie.Title)}
                  showRemove
                  onRemove={() => removeFromWatchlist(movie.imdbID)}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Trailer Modal */}
      <TrailerModal
        isOpen={trailerModal.isOpen}
        onClose={() =>
          setTrailerModal({
            isOpen: false,
            videoId: null,
            movieTitle: "",
            fallbackUrl: undefined,
          })
        }
        videoId={trailerModal.videoId}
        movieTitle={trailerModal.movieTitle}
        fallbackUrl={trailerModal.fallbackUrl}
      />
    </div>
  );
};

export default Index;
