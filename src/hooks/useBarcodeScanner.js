import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Enhanced barcode scanner hook that supports:
 * 1. Direct input typing & submission (Enter key)
 * 2. Hardware barcode scanner keyboard-wedge detection
 */
export default function useBarcodeScanner(onScan) {
  const inputRef = useRef(null);
  const [value, setValue] = useState("");
  const scanCallbackRef = useRef(onScan);

  useEffect(() => {
    scanCallbackRef.current = onScan;
  }, [onScan]);

  const focusScanner = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Initial focus on mount
    const timeout = setTimeout(() => {
      focusScanner();
    }, 100);
    return () => clearTimeout(timeout);
  }, [focusScanner]);

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const code = value.trim();
      if (code && scanCallbackRef.current) {
        scanCallbackRef.current(code);
      }
      setValue("");
      requestAnimationFrame(() => {
        focusScanner();
      });
    }
  };

  const clearScanner = useCallback(() => {
    setValue("");
  }, []);

  return {
    inputRef,
    value,
    setValue,
    focusScanner,
    clearScanner,
    handleChange,
    handleKeyDown,
  };
}
