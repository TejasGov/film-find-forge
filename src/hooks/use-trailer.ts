import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { findTrailer } from "@/services/youtube";

interface TrailerState {
  isOpen: boolean;
  videoId: string | null;
  movieTitle: string;
  fallbackUrl?: string;
}

const CLOSED: TrailerState = { isOpen: false, videoId: null, movieTitle: "" };

export function useTrailer() {
  const [trailerModal, setTrailerModal] = useState<TrailerState>(CLOSED);
  const { toast } = useToast();

  const openTrailer = async (movieTitle: string) => {
    try {
      const result = await findTrailer(movieTitle);
      if (!result) {
        toast({ title: "Trailer not found", description: "No trailer available for this movie", variant: "destructive" });
        return;
      }
      setTrailerModal({ isOpen: true, movieTitle, ...result });
    } catch {
      toast({ title: "Error loading trailer", description: "Please check your YouTube API key", variant: "destructive" });
    }
  };

  const closeTrailer = () => setTrailerModal(CLOSED);

  return { trailerModal, openTrailer, closeTrailer };
}
