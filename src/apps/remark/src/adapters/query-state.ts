import { useCallback } from 'react';

import { navigate, useLocation } from './navigation';
interface Options<T> {
  clearOnDefault?: boolean;
  defaultValue?: T;
  parse?: (value: string) => T;
  serialize?: (value: T) => null | string;
  shallow?: boolean;
}
type Setter<T> = (next: ((current: null | T) => null | T) | null | T) => Promise<URLSearchParams>;
export function useQueryState<T = string>(
  key: string,
  options: Options<T> & { defaultValue: T },
): readonly [T, Setter<T>];
export function useQueryState<T = string>(
  key: string,
  options?: Options<T>,
): readonly [null | T, Setter<T>];
export function useQueryState<T = string>(key: string, options: Options<T> = {}) {
  const location = useLocation();
  const raw = new URLSearchParams(location.split('?')[1] || '').get(key);
  let value: null | T = options.defaultValue ?? null;
  if (raw !== null) {
    try {
      value = options.parse ? options.parse(raw) : (raw as T);
    } catch {
      /* Use the default for malformed values. */
    }
  }
  const { defaultValue, serialize } = options;
  const setValue = useCallback(
    (next: ((current: null | T) => null | T) | null | T) => {
      const current = window.location.hash.slice(1) || '/';
      const params = new URLSearchParams(current.split('?')[1] || '');
      const resolved =
        typeof next === 'function' ? (next as (current: null | T) => null | T)(value) : next;
      let serialized: null | string = null;
      if (resolved !== null) {
        serialized = serialize ? serialize(resolved) : String(resolved);
      }
      if (serialized === null || resolved === defaultValue) params.delete(key);
      else params.set(key, serialized);
      navigate(`${current.split('?')[0]}${params.size ? `?${params}` : ''}`, true);
      return Promise.resolve(params);
    },
    [key, value, defaultValue, serialize],
  );
  return [value, setValue] as const;
}
