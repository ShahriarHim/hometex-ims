import { useState, useEffect } from 'react';

/**
 * Debounces a value by the given delay (ms).
 * Use for search inputs to avoid firing on every keystroke.
 *
 * Usage:
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 400);
 *   // pass debouncedSearch to the query key
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
