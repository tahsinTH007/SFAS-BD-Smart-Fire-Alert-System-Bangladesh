"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * Keeps Leaflet's internal viewport in sync with its container.
 *
 * Leaflet measures the container once at init. This map mounts inside a flex
 * column that is still settling at that moment, so it latched onto a small
 * intermediate size and rendered tiles into a box in the middle of the panel.
 * `invalidateSize()` on mount and on every container resize fixes it.
 */
export const MapResizeHandler = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    // Two frames: one for layout to settle, one after paint.
    const raf = requestAnimationFrame(() => {
      map.invalidateSize({ animate: false });
      requestAnimationFrame(() => map.invalidateSize({ animate: false }));
    });

    const observer = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    observer.observe(container);

    const onWindowResize = () => map.invalidateSize({ animate: false });
    window.addEventListener("resize", onWindowResize);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", onWindowResize);
    };
  }, [map]);

  return null;
};
