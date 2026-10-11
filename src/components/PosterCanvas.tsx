import { useEffect, useRef } from "react";
import type { Movie } from "@/types/movie";

const W = 168;
const H = 252;
const GAP = 44;
const COLS = 15;
const STAGGER = 150;

interface Props {
  movies: Movie[];
  onSelect: (m: Movie) => void;
}

const mod = (n: number, m: number) => ((n % m) + m) % m;
/** Roughly one in three posters carries the pixel-bloom hover. */
const blooms = (i: number) => (i * 7) % 3 === 0;

export const PosterCanvas = ({ movies, onSelect }: Props) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const moved = useRef(0);
  const readout = useRef<HTMLSpanElement>(null);

  const rows = Math.ceil(movies.length / COLS);
  const tileW = COLS * (W + GAP);
  const tileH = rows * (H + GAP + 22) + STAGGER;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const target = { x: -tileW / 2 + window.innerWidth / 2, y: -tileH / 2 + window.innerHeight / 2 };
    const cur = { ...target };
    const vel = { x: 0, y: 0 };
    let drag: { x: number; y: number } | null = null;
    let raf = 0;
    let frame = 0;

    const tick = () => {
      if (!drag) {
        target.x += vel.x;
        target.y += vel.y;
        vel.x *= 0.92;
        vel.y *= 0.92;
      }
      cur.x += (target.x - cur.x) * 0.1;
      cur.y += (target.y - cur.y) * 0.1;
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const col = i % COLS;
        const row = Math.floor(i / COLS);
        const bx = col * (W + GAP);
        const by = row * (H + GAP + 22) + (col % 2 ? STAGGER : 0);
        const x = mod(bx + cur.x + W, tileW) - W;
        const y = mod(by + cur.y + H, tileH) - H;
        const dx = (x + W / 2 - cx) / cx;
        const dy = (y + H / 2 - cy) / cy;
        const d = Math.min(1, Math.sqrt(dx * dx + dy * dy) / 1.5);
        el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${1 - d * 0.12})`;
        el.style.opacity = String(1 - d * 0.6);
      });
      if (readout.current && ++frame % 4 === 0)
        readout.current.textContent = `X ${String(Math.round(-cur.x)).padStart(5, "0")}  Y ${String(Math.round(-cur.y)).padStart(5, "0")}`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const down = (e: PointerEvent) => {
      drag = { x: e.clientX, y: e.clientY };
      moved.current = 0;
      vel.x = vel.y = 0;
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
    <div ref={rootRef} className="fixed inset-0 overflow-hidden cursor-grab touch-none select-none data-[dragging=true]:cursor-grabbing">
      {/* SVG pixelate filter used by the bloom layer */}
      <svg className="absolute h-0 w-0" aria-hidden>
        <filter id="pixelate" x="0" y="0">
          <feFlood x="5" y="5" height="2" width="2" />
          <feComposite width="12" height="12" />
          <feTile result="grid" />
          <feComposite in="SourceGraphic" in2="grid" operator="in" />
          <feMorphology operator="dilate" radius="6" />
        </filter>
      </svg>

      {movies.map((m, i) => {
        const bloom = blooms(i);
        return (
          <button
            key={m.imdbID}
            ref={(el) => (itemRefs.current[i] = el)}
            onClick={() => moved.current < 6 && onSelect(m)}
            className="group absolute left-0 top-0 text-left will-change-transform"
            style={{ width: W }}
            aria-label={m.Title}
          >
            <div className="relative" style={{ height: H }}>
              {bloom && (
                <img src={m.Poster} alt="" draggable={false} aria-hidden className="bloom-layer pointer-events-none absolute inset-0 h-full w-full object-cover" />
              )}
              <div className="relative h-full w-full overflow-hidden bg-card shadow-poster ring-1 ring-foreground/10 transition-transform duration-500 ease-out group-hover:-translate-y-1">
                <img src={m.Poster} alt="" draggable={false} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                {bloom && (
                  <img src={m.Poster} alt="" draggable={false} aria-hidden className="pixel-flash pointer-events-none absolute inset-0 h-full w-full object-cover" />
                )}
              </div>
            </div>
            <div className="mt-2.5 flex items-baseline justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground opacity-60 transition-opacity duration-300 group-hover:opacity-100">
              <span className="truncate">{m.Title}</span>
              <span className="shrink-0 tabular-nums">{String(i + 1).padStart(3, "0")}</span>
            </div>
          </button>
        );
      })}
      <div className="pointer-events-none absolute inset-0 bg-vignette" />
      <div className="grain pointer-events-none absolute inset-0" />
      <span ref={readout} className="pointer-events-none fixed bottom-6 left-6 z-30 hidden font-mono text-[10px] tracking-[0.2em] text-muted-foreground md:block" />
    </div>
  );
};
