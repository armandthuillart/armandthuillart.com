import { getBackend } from '../mock/backend.svelte';
import type { PaginationStatus } from '../mock/types';
export interface QueryResult<T = unknown> {
  readonly data: any;
  readonly error: Error | undefined;
  readonly isLoading: boolean;
}
type OptimisticStore = {
  getQuery(fn: string, args: any): (any[] & { name: string }) | undefined;
  getAllQueries(fn: string): { args: any; value: { page: any[] } | undefined }[];
  setQuery(fn: string, args: any, value: any): void;
};
export function useConvex(_token?: () => unknown) {
  return getBackend();
}
export function useMutation(fn: string) {
  const backend = getBackend();
  return (args: any, _options?: { optimisticUpdate: (store: OptimisticStore) => void }) =>
    backend.mutate(fn, args);
}
export function usePaginatedQuery(fn: string, args: () => any, options = { initialNumItems: 20 }) {
  const backend = getBackend();
  let limit = $state(options.initialNumItems);
  const all = $derived(backend.query(fn, args()) ?? []);
  return {
    get results(): any[] {
      return all.slice(0, limit);
    },
    get status(): PaginationStatus {
      return all.length > limit ? 'CanLoadMore' : 'Exhausted';
    },
    isLoading: false,
    loadMore(count = options.initialNumItems) {
      limit += count;
    },
  };
}
export function useQuery(fn: string, args: (() => any) | any = () => ({})): QueryResult {
  const backend = getBackend();
  const data = $derived(backend.query(fn, typeof args === 'function' ? args() : args));
  return {
    get data() {
      return data;
    },
    get error() {
      return data === null && fn === 'projects.getProject'
        ? new Error('Project not found')
        : undefined;
    },
    isLoading: false,
  };
}
