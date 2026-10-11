import { useEffect, RefObject } from "react";
import Lenis from "lenis";

/** Smooth, eased scrolling inside an overlay's scroll container. */
export function useLenis(wrapper: RefObject<HTMLElement>, content: RefObject<HTMLElement>, active = true) {
  useEffect(() => {
    if (!active || !wrapper.current || !content.current) return;
    const lenis = new Lenis({ wrapper: wrapper.current, content: content.current, lerp: 0.09 });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, [wrapper, content, active]);
}
