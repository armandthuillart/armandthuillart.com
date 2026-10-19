import { getBackend } from './backend.svelte';
export function getPage() {
  return getBackend().page;
}
export const dev = true;
const browser = typeof window !== 'undefined';
export const posthog = { reset() {} };
export async function goto(href: string, options?: { replace?: boolean; reset?: boolean }) {
  if (/^https?:/.test(href)) {
    window.open(href, '_blank', 'noopener,noreferrer');
    return;
  }
  window.history[options?.replace ? 'replaceState' : 'pushState'](
    {},
    '',
    href === '/' ? '#dimsight' : href,
  );
  window.dispatchEvent(new Event('dimsight:navigate'));
}
export async function invalidate(_key?: string) {}
export async function mockFetch(_url: string, _options?: RequestInit) {
  return new Response(null, { status: 204 });
}
export function resolve(route: string, params: Record<string, string> = {}) {
  if (route.includes('/f/[id]')) return `#dimsight/f/${encodeURIComponent(params.id)}`;
  if (route.includes('/s/[token]')) {
    const base = typeof window === 'undefined' ? '/en/apps/dimsight/' : window.location.pathname;
    return `${base}#dimsight/s/${encodeURIComponent(params.token)}`;
  }
  if (route === 'home') return 'https://dimsight.com';
  return '#dimsight';
}
