import { X, ExternalLink } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

interface TrailerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoId: string | null;
  movieTitle: string;
  fallbackUrl?: string;
}

// Rendered above every other layer (detail sheet, movie night) so the trailer is never hidden.
export const TrailerModal = ({ isOpen, onClose, videoId, movieTitle, fallbackUrl }: TrailerModalProps) => (
  <DialogPrimitive.Root open={isOpen} onOpenChange={(o) => !o && onClose()}>
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-background/90 backdrop-blur-md animate-in fade-in" />
      <DialogPrimitive.Content
        onKeyDown={(e) => e.stopPropagation()}
        className="fixed left-1/2 top-1/2 z-[101] w-[min(92vw,64rem)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-poster animate-in zoom-in-95 fade-in"
      >
        <DialogPrimitive.Title className="sr-only">{movieTitle} trailer</DialogPrimitive.Title>
        <DialogPrimitive.Description className="sr-only">Video trailer for {movieTitle}</DialogPrimitive.Description>
        <DialogPrimitive.Close
          aria-label="Close trailer"
          className="absolute right-3 top-3 z-10 rounded-full bg-background/70 p-2 text-muted-foreground backdrop-blur transition hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </DialogPrimitive.Close>
        {videoId ? (
          <div className="relative pt-[56.25%]">
            <iframe
              className="absolute inset-0 h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title={`${movieTitle} trailer`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="p-16 text-center">
            <h3 className="mb-3 font-display text-3xl text-foreground">Trailer can't play here</h3>
            <p className="mb-6 text-sm text-muted-foreground">The studio blocks this trailer outside YouTube.</p>
            {fallbackUrl && (
              <a
                href={fallbackUrl}
                target="_blank"
                rel="noreferrer"
                className="mx-auto inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-110"
              >
                <ExternalLink className="h-4 w-4" /> Watch on YouTube
              </a>
            )}
          </div>
        )}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  </DialogPrimitive.Root>
);
