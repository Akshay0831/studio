import { useEffect, useRef, MouseEvent } from 'react';

export function useClickOutside<T extends HTMLElement>(
  callback: () => void,
  buttonSelector?: string
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Check if click is on the specified button
      if (buttonSelector) {
        const button = document.querySelector(buttonSelector) as HTMLElement;
        if (button && button.contains(event.target as Node)) {
          return;
        }
      }

      // Check if click is outside the ref element
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    // Add event listeners for both mouse and touch events
    const handleMouseDown = (event: Event) => handleClick(event as unknown as MouseEvent);
    const handleTouchStart = (event: Event) => handleClick(event as unknown as MouseEvent);
    
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleTouchStart);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [callback, buttonSelector]);

  return ref;
}

export function useFocusOutside<T extends HTMLElement>(
  callback: () => void
): React.RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const handleFocus = (event: FocusEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };

    document.addEventListener('focusin', handleFocus, true);

    return () => {
      document.removeEventListener('focusin', handleFocus, true);
    };
  }, [callback]);

  return ref;
}