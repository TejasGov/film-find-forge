import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
  apiKey: string;
}

interface MovieSuggestion {
  Title: string;
  Poster: string;
  imdbID: string;
  Year: string;
}

export const SearchBar = ({ searchQuery, onSearchChange, onSearch, apiKey }: SearchBarProps) => {
  const [suggestions, setSuggestions] = useState<MovieSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  // Fetch suggestions from OMDb API
  const fetchSuggestions = async (query: string) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}`
      );
      const data = await response.json();

      if (data.Response === "True" && data.Search) {
        setSuggestions(data.Search.slice(0, 8));
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchSuggestions(searchQuery);
    }, 400);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      setShowSuggestions(false);
      onSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (title: string) => {
    onSearchChange(title);
    setShowSuggestions(false);
    setTimeout(() => onSearch(), 100);
  };

  const handleClearSearch = () => {
    onSearchChange("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in" ref={searchBarRef}>
      <div className="flex gap-3 relative">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder="Search for movies, TV series, dramas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="h-14 text-lg bg-secondary border-border focus:ring-primary focus:ring-2 pr-10"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-card overflow-hidden z-50 animate-fade-in">
              {isLoading && (
                <div className="p-4 text-center text-muted-foreground">
                  Loading suggestions...
                </div>
              )}
              {!isLoading && suggestions.map((movie) => (
                <button
                  key={movie.imdbID}
                  onClick={() => handleSuggestionClick(movie.Title)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-secondary/60 transition-colors text-left border-b border-border last:border-b-0"
                >
                  <img
                    src={movie.Poster !== "N/A" ? movie.Poster : "/placeholder.svg"}
                    alt={movie.Title}
                    className="w-12 h-16 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = "/placeholder.svg";
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {movie.Title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {movie.Year}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={() => {
            setShowSuggestions(false);
            onSearch();
          }}
          size="lg"
          className="h-14 px-8 bg-primary hover:bg-primary/90 shadow-glow transition-all"
        >
          <Search className="w-5 h-5 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
};
