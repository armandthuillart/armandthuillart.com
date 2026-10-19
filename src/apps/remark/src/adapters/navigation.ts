import { useSyncExternalStore } from 'react';
// Opening the app without a route lands on the marketing page; the dashboard lives at '/'.
const landingPath = '/home';
const listeners = new Set<() => void>();
function notify() {
  for (const listener of listeners) listener();
}
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener('popstate', listener);
  window.addEventListener('hashchange', listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('popstate', listener);
    window.removeEventListener('hashchange', listener);
  };
};
export function navigate(href: string, replace = false) {
  if (typeof window === 'undefined') return;
  if (!href.startsWith('/') || href.startsWith('//')) return;
  window.history[replace ? 'replaceState' : 'pushState'](
    null,
    '',
    `${window.location.pathname}${window.location.search}#${href}`,
  );
  notify();
}
export function useLocation() {
  return useSyncExternalStore(subscribe, localPath, () => landingPath);
}
export function usePathname() {
  return useLocation().split(/[?#]/)[0];
}
function localPath() {
  return typeof window === 'undefined' ? landingPath : window.location.hash.slice(1) || landingPath;
}
const router = {
  back: () => {
    window.history.back();
  },
  push: (href: string) => {
    navigate(href);
  },
  refresh: notify,
  replace: (href: string) => {
    navigate(href, true);
  },
};
export function useRouter() {
  return router;
}
