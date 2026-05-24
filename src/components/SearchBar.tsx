import { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

export const SearchBar = ({ searchQuery, onSearchChange, onSearch }: SearchBarProps) => {
  const searchBarRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  const handleClearSearch = () => {
    onSearchChange("");
  };

  return (
    <div className="w-full max-w-3xl mx-auto animate-fade-in" ref={searchBarRef}>
      <div className="relative">
        {/* Pill input row */}
        <div className="flex items-center gap-2 bg-white/5 rounded-full border border-white/10 hover:border-white/20 focus-within:border-primary/40 focus-within:bg-white/[0.07] transition-all duration-200 px-2 py-2">
          <Search className="w-5 h-5 text-muted-foreground ml-3 shrink-0" />
          <input
            type="text"
            placeholder="Search movies, series, dramas..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 px-2 py-1.5 text-base outline-none min-w-0"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 shrink-0"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onSearch}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-full transition-colors shrink-0"
          >
            Search
          </button>
        </div>
      </div>
    </div>
  );
};
