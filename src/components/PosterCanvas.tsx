import { useEffect, useRef } from "react";
import type { Movie } from "@/types/movie";

const W = 176;
const H = 264;
const GAP = 32;
const COLS = 12;

interface Props {
  movies: Movie[];
  onSelect: (m: Movie) => void;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;

export const PosterCanvas = ({ movies, onSelect }: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const moved = useRef(0);

  const rows = Math.ceil(movies.length / COLS);
  const tileW = COLS * (W + GAP);
  const tileH = rows * (H + GAP) + 140;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const target = { x: -tileW / 2 + window.innerWidth / 2, y: -tileH / 2 + window.innerHeight / 2 };
    const cur = { ...target };
    const vel = { x: 0, y: 0 };
    let drag: { x: number; y: number } | null = null;
    let raf = 0;

    const tick = () => {
      if (!drag) {
        target.x += vel.x;
        target.y += vel.y;
        vel.x *= 0.92;
        vel.y *= 0.92;
      }
      cur.x += (target.x - cur.x) * 0.12;
      cur.y += (target.y - cur.y) * 0.12;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const bx = col * (W + GAP);
        const by = row * (H + GAP) + (col % 2 ? 140 : 0);
        const x = mod(bx + cur.x + W, tileW) - W;
        const y = mod(by + cur.y + H, tileH) - H;
        // gentle depth: posters near the centre sit slightly larger
        const dx = (x + W / 2 - cx) / cx;
        const dy = (y + H / 2 - cy) / cy;
        const d = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 1.4);
        const s = 1.04 - d * 0.14;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${s})`;
        el.style.opacity = String(1 - d * 0.55);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY };
      moved.current = 0;
      vel.x = vel.y = 0;
      root.setPointerCapture?.(e.pointerId);
      root.dataset.dragging = "true";
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      drag = { x: e.clientX, y: e.clientY };
      moved.current += Math.abs(dx) + Math.abs(dy);
      target.x += dx;
      target.y += dy;
      vel.x = dx;
      vel.y = dy;
    };
    const up = () => {
      drag = null;
      delete root.dataset.dragging;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      target.x -= e.deltaX;
      target.y -= e.deltaY;
    };

    root.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    root.addEventListener("wheel", wheel, { passive: false });
    return () => {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      root.removeEventListener("wheel", wheel);
    };
  }, [tileW, tileH]);

  return (
    <div
      ref={rootRef}
      className="group/canvas fixed inset-0 overflow-hidden cursor-grab touch-none select-none data-[dragging=true]:cursor-grabbing"
    >
      {movies.map((m, i) => (
        <button
          key={m.imdbID}
          ref={(el) => (itemRefs.current[i] = el)}
          onClick={() => moved.current < 6 && onSelect(m)}
          className="poster-tile absolute left-0 top-0 will-change-transform"
          style={{ width: W, height: H }}
          aria-label={m.Title}
        >
          <div className="relative h-full w-full overflow-hidden rounded-md bg-card shadow-poster ring-1 ring-border/60 transition-transform duration-500 ease-out hover:-translate-y-1.5">
            <img
              src={m.Poster}
              alt=""
              draggable={false}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-background via-background/30 to-transparent p-3 text-left opacity-0 transition-opacity duration-300 hover:opacity-100">
              <span className="font-display text-lg leading-tight text-foreground">{m.Title}</span>
              <span className="mt-1 text-[11px] tracking-wide text-muted-foreground">
                {m.Year} · ★ {m.imdbRating}
              </span>
            </div>
          </div>
        </button>
      ))}
      <div className="pointer-events-none absolute inset-0 bg-vignette" />
    </div>
  );
};
