import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps Tab/Shift+Tab focus inside a modal/overlay while `active` is true, and
 * closes it on Escape. Without this, keyboard-only users tabbing through an open
 * modal fall through into the (visually hidden) page behind it — the focus order
 * jumps around unpredictably instead of cycling through just the dialog's controls.
 */
export function useFocusTrap(active: boolean, onClose?: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Callers almost always pass an inline arrow function (`() => setOpen(false)`),
  // which gets a new identity on every parent render. If that identity were a
  // dependency of the effect below, ANY unrelated state update in the parent
  // (e.g. typing in a search input inside the modal) would re-run the effect and
  // force focus back onto the modal's first focusable element mid-keystroke,
  // stealing focus from whatever the user was actually typing into. Storing the
  // latest callback in a ref lets the effect read it without depending on it.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    const getFocusable = () => Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));

    const focusables = getFocusable();
    (focusables[0] ?? container).focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCloseRef.current) {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = getFocusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onClose intentionally excluded, see onCloseRef above.
  }, [active]);

  return containerRef;
}
