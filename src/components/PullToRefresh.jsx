import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, RefreshCw } from "lucide-react";

const THRESHOLD = 70;
const RESISTANCE = 2.5;

export default function PullToRefresh({ onRefresh, isRefreshing, children }) {
  const [pull, setPull] = useState(0);
  const startY = useRef(null);
  const pulling = useRef(false);

  const onTouchStart = useCallback((e) => {
    if (window.scrollY > 0) {
      startY.current = null;
      return;
    }
    startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null || isRefreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0 && window.scrollY <= 0) {
      pulling.current = true;
      setPull(Math.min(delta / RESISTANCE, THRESHOLD * 1.5));
      if (e.cancelable) e.preventDefault();
    } else {
      pulling.current = false;
    }
  }, [isRefreshing]);

  const onTouchEnd = useCallback(() => {
    if (pull >= THRESHOLD && !isRefreshing) {
      onRefresh?.();
    }
    startY.current = null;
    pulling.current = false;
    setPull(0);
  }, [pull, isRefreshing, onRefresh]);

  useEffect(() => {
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [onTouchStart, onTouchMove, onTouchEnd]);

  const progress = Math.min(pull / THRESHOLD, 1);
  const showSpinner = isRefreshing || pull > 0;

  return (
    <div style={{ transform: `translateY(${isRefreshing ? THRESHOLD : pull}px)`, transition: pulling.current ? "none" : "transform 0.3s ease" }}>
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{ height: isRefreshing ? THRESHOLD : Math.max(0, pull), transition: pulling.current ? "none" : "height 0.3s ease" }}
      >
        {showSpinner && (
          isRefreshing ? (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          ) : (
            <RefreshCw
              className="text-primary transition-opacity"
              style={{ transform: `rotate(${progress * 360}deg)`, opacity: progress }}
            />
          )
        )}
      </div>
      {children}
    </div>
  );
}