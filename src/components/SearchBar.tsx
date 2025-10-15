import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearch: () => void;
}

export const SearchBar = ({ searchQuery, onSearchChange, onSearch }: SearchBarProps) => {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onSearch();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in">
      <div className="flex gap-3">
        <Input
          type="text"
          placeholder="Search for movies, TV series, dramas..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="h-14 text-lg bg-secondary border-border focus:ring-primary focus:ring-2"
        />
        <Button
          onClick={onSearch}
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
