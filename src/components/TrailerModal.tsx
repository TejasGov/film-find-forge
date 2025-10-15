import { X, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string | null;
  movieTitle: string;
  fallbackUrl?: string;
}

export const TrailerModal = ({ 
  isOpen, 
  onClose, 
  videoId, 
  movieTitle,
  fallbackUrl 
}: TrailerModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-card border-border">
        <DialogTitle className="sr-only">{movieTitle} Trailer</DialogTitle>
        <div className="relative">
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="absolute -top-12 right-0 z-50 text-foreground hover:bg-secondary"
          >
            <X className="w-6 h-6" />
          </Button>

          {videoId ? (
            <div className="relative pt-[56.25%]">
              <iframe
                className="absolute inset-0 w-full h-full rounded-lg"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={`${movieTitle} Trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="p-12 text-center">
              <h3 className="text-2xl font-bold mb-4 text-foreground">
                Trailer Not Embeddable
              </h3>
              <p className="text-muted-foreground mb-6">
                This trailer cannot be played here due to studio restrictions.
              </p>
              {fallbackUrl && (
                <Button
                  onClick={() => window.open(fallbackUrl, '_blank')}
                  className="bg-primary hover:bg-primary/90"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Watch on YouTube
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
