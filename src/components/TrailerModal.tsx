import { X, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string | null;
  movieTitle: string;
  fallbackUrl?: string;
}

export const TrailerModal = ({ isOpen, onClose, videoId, movieTitle, fallbackUrl }: TrailerModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl p-0 bg-black border-white/10 rounded-2xl overflow-hidden">
        <DialogTitle className="sr-only">{movieTitle} Trailer</DialogTitle>
        <div className="relative">
          <button
            onClick={onClose}
            className="absolute -top-11 right-0 z-50 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {videoId ? (
            <div className="relative pt-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={`${movieTitle} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-16 text-center">
              <h3 className="text-xl font-bold mb-3 text-foreground">Trailer Not Embeddable</h3>
              <p className="text-muted-foreground text-sm mb-6">
                This trailer cannot be played here due to studio restrictions.
              </p>
              {fallbackUrl && (
                <button
                  onClick={() => window.open(fallbackUrl, "_blank")}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm px-6 py-2.5 rounded-full transition-all mx-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                  Watch on YouTube
                </button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
