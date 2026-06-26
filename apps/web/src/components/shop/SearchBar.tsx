'use client';
import { useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

// Debounced search input (300ms). Emits the debounced term to the parent, which
// pushes it into the URL and refetches.
export function SearchBar({ initial = '', onSearch }: { initial?: string; onSearch: (term: string) => void }) {
  const [term, setTerm] = useState(initial);
  const debounced = useDebounce(term, 300);

  useEffect(() => {
    onSearch(debounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <input
      type="search"
      value={term}
      onChange={(e) => setTerm(e.target.value)}
      placeholder="Search by name, e.g. ‘Notion’ or ‘desk organizer’"
      aria-label="Search products"
      className="input"
    />
  );
}
