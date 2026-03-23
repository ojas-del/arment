"use client";

import { useState, useEffect } from "react";

const MOBILE_BREAKPOINT = 1023; // matches Tailwind lg breakpoint

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`);
    setIsMobile(mq.matches);
    setIsLoaded(true);

    function onChange(e: MediaQueryListEvent) {
      setIsMobile(e.matches);
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return { isMobile, isLoaded };
}
