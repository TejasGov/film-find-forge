import { useState } from "react";
import { Film, BookmarkCheck } from "lucide-react";
import { SearchBar } from "@/components/SearchBar";
import { MovieCard } from "@/components/MovieCard";
import { TrailerModal } from "@/components/TrailerModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// API Keys - Replace with your own
const OMDB_API_KEY = "YOUR_OMDB_API_KEY"; // Get from http://www.omdbapi.com/apikey.aspx
const YOUTUBE_API_KEY = "YOUR_YOUTUBE_API_KEY"; // Get from https://console.cloud.google.com/

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
  const { toast } = useToast();

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
          />
        </div>

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
