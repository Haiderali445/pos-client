import { useEffect, useRef } from "react";

export default function usePosShortcuts({ onScanner, onCheckout, onEscape, onSearch }) {
  const callbacksRef = useRef({ onScanner, onCheckout, onEscape, onSearch });

  useEffect(() => {
    callbacksRef.current = { onScanner, onCheckout, onEscape, onSearch };
  }, [onScanner, onCheckout, onEscape, onSearch]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // F2: Focus scanner / search
      if (event.key === "F2") {
        event.preventDefault();
        callbacksRef.current.onScanner?.();
      }

      // F4: Quick checkout
      if (event.key === "F4") {
        event.preventDefault();
        callbacksRef.current.onCheckout?.();
      }

      // Escape: Clear search / close modals
      if (event.key === "Escape") {
        callbacksRef.current.onEscape?.();
      }

      // Ctrl + K or /: Global search
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        callbacksRef.current.onSearch?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
