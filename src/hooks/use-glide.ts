import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from "react";

/** Measures a target element inside a container so one pill can glide between items. */
export function useGlide<C extends HTMLElement>(axis: "x" | "y" = "x") {
  const container = useRef<C>(null);
  const [style, setStyle] = useState<CSSProperties>({ opacity: 0 });

  const moveTo = useCallback(
    (el: HTMLElement | null) => {
      const c = container.current;
      if (!c || !el) return setStyle((s) => ({ ...s, opacity: 0 }));
      const cr = c.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      setStyle({
        opacity: 1,
        width: axis === "x" ? r.width : undefined,
        height: r.height,
        transform: `translate(${r.left - cr.left}px, ${r.top - cr.top}px)`,
      });
    },
    [axis],
  );

  return { container, style, moveTo };
}

/** Re-measures the active item whenever `key` changes or the window resizes. */
export function useActiveGlide(moveTo: (el: HTMLElement | null) => void, getActive: () => HTMLElement | null, key: unknown) {
  useLayoutEffect(() => {
    const run = () => moveTo(getActive());
    run();
    const t = setTimeout(run, 60);
    window.addEventListener("resize", run);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", run);
    };
  }, [key, moveTo, getActive]);
}
