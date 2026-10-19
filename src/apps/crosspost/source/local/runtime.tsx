import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

import en from '../messages/en.json';
import fr from '../messages/fr.json';
import { reply } from './assistant';

export type GetRateLimitValueQuery = string;
export type Id<_T = string> = string;
export type PaginationResult<T> = { page: T[]; isDone: boolean; continueCursor: string };
export type ParamsOf<_T = string> = { chatId: string | null };
export type Preloaded<_T = unknown> = string;
export type ThreadDoc = { _id: string; title: string; _creationTime: number };
export type UIMessage = {
  id: string;
  key: string;
  role: 'user' | 'assistant';
  text: string;
  status: string;
  order: number;
  parts: any[];
};
const names = [
  'auth.getUser',
  'chats.listChats',
  'chats.loadChat',
  'chats.createChat',
  'chats.sendMessage',
  'chats.deleteChats',
  'drafts.getDraft',
  'drafts.updateDraft',
  'streams.abortStreamByOrder',
  'rateLimiting.getAnonymousRateLimit',
  'rateLimiting.getFreeRateLimit',
  'rateLimiting.getProRateLimit',
];
export const api: any = {};
for (const name of names) {
  const [group, key] = name.split('.');
  (api[group] ??= {})[key] = name;
}
const initial = {
  path: '/',
  locale: 'en',
  theme: 'system',
  color: 'default',
  search: '',
  flags: {} as Record<string, boolean>,
  user: {
    id: 'local',
    firstName: 'Alex',
    lastName: 'Morgan',
    email: 'alex@example.com',
    tier: 'free',
  },
  chats: [] as ThreadDoc[],
  messages: {} as Record<string, UIMessage[]>,
  drafts: {} as Record<string, any>,
};
let state = initial;
const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
function update(patch: Partial<typeof initial>) {
  state = { ...state, ...patch };
  for (const fn of listeners) fn();
  try {
    localStorage.setItem('crosspost-local-v1', JSON.stringify(state));
  } catch {}
}
function useStore() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => initial,
  );
}
const Context = createContext(true);
export function LocalProvider({
  children,
  locale = 'en',
}: {
  children: React.ReactNode;
  locale?: string;
}) {
  const s = useStore();
  useEffect(() => {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem('crosspost-local-v1') ?? '{}');
    } catch {}
    update({ ...saved, path: '/', locale: locale === 'fr' ? 'fr' : 'en' });
  }, [locale]);
  useEffect(() => {
    document.documentElement.dataset.theme = s.color;
    document.documentElement.classList.toggle(
      'dark',
      s.theme === 'dark' ||
        (s.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches),
    );
  }, [s.theme, s.color]);
  useEffect(() => {
    const htmlClasses = ['relative', 'h-full'];
    const bodyClasses = [
      'relative',
      'h-full',
      'bg-background',
      'font-sans',
      'text-foreground',
      'antialiased',
    ];
    const addedHtml = htmlClasses.filter((c) => !document.documentElement.classList.contains(c));
    const addedBody = bodyClasses.filter((c) => !document.body.classList.contains(c));
    document.documentElement.classList.add(...htmlClasses);
    document.body.classList.add(...bodyClasses);
    return () => {
      document.documentElement.classList.remove(...addedHtml);
      document.body.classList.remove(...addedBody);
    };
  }, []);
  return <Context.Provider value={true}>{children}</Context.Provider>;
}
export function useParams<_T = unknown>(): ParamsOf {
  const s = useStore();
  return { chatId: s.path.startsWith('/chat/') ? s.path.split('/')[2] : null };
}
export function usePathname() {
  return useStore().path;
}
const navigate = (path: string, options?: { locale?: string }) => {
  update({ path: path.split('?')[0], ...(options?.locale ? { locale: options.locale } : {}) });
};
export type Locale = string;
export function useLocale() {
  return useStore().locale;
}
export function useRouter() {
  return { push: navigate, replace: navigate, refresh() {} };
}
export const routing = { locales: ['en', 'fr'] };
export function useTranslations(namespace: string) {
  const s = useStore();
  const messages: any = s.locale === 'fr' ? fr : en;
  return (key: string, values?: Record<string, any>) => {
    const value = key.split('.').reduce((v, k) => v?.[k], messages[namespace]);
    if (typeof value !== 'string') return key;
    return value.replace(/\{(\w+)\}/g, (_: string, key: string) => String(values?.[key] ?? ''));
  };
}
export const parseAsBoolean = { withDefault: (value: boolean) => value };
export function useQueryState(
  key: string,
  fallback = false,
): [boolean, (value: React.SetStateAction<boolean>) => void] {
  const s = useStore();
  return [
    s.flags[key] ?? fallback,
    (value) => {
      update({
        flags: {
          ...state.flags,
          [key]: typeof value === 'function' ? value(state.flags[key] ?? fallback) : value,
        },
      });
    },
  ];
}
export function useTheme() {
  const s = useStore();
  return {
    theme: s.theme,
    themes: ['system', 'light', 'dark'],
    setTheme: (theme: string) => {
      update({ theme });
    },
  };
}
export const themeColors = ['default', 'green', 'blue', 'pink', 'orange'];
export function useHistorySearch(): [string, (search: string) => void] {
  const s = useStore();
  return [
    s.search,
    (search) => {
      update({ search });
    },
  ];
}
export function usePreloadedQuery(query: string): any {
  const s = useStore();
  return query === api.auth.getUser
    ? s.user
    : {
        page: s.chats.filter((c) =>
          c.title.toLocaleLowerCase().includes(s.search.toLocaleLowerCase()),
        ),
        isDone: true,
        continueCursor: '',
      };
}
export function useQuery(query: string, args: any): any {
  const s = useStore();
  return query === api.drafts.getDraft ? s.drafts[args.draftId] : undefined;
}
export function useThemeStore() {
  const s = useStore();
  return {
    themeColor: s.color,
    setThemeColor: (color: string) => {
      update({ color });
    },
  };
}
export function useUIMessages(_query: any, args: any, _options?: any) {
  const s = useStore();
  return {
    loadMore() {},
    results: args === 'skip' ? [] : (s.messages[args.threadId] ?? []),
    status: 'Exhausted',
  };
}
const pending = new Map<string, ReturnType<typeof setTimeout>>();
export function useMutation(query: string): any {
  useContext(Context);
  const mutate = async (args: any) => {
    if (query === api.chats.createChat) {
      const id = crypto.randomUUID();
      update({
        chats: [
          {
            _creationTime: Date.now(),
            _id: id,
            title: 'New chat',
          },
          ...state.chats,
        ],
      });
      return id;
    }
    if (query === api.chats.deleteChats) {
      for (const id of args.threadIds) {
        clearTimeout(pending.get(id));
        pending.delete(id);
      }
      update({
        chats: state.chats.filter((c) => !args.threadIds.includes(c._id)),
        messages: Object.fromEntries(
          Object.entries(state.messages).filter(([id]) => !args.threadIds.includes(id)),
        ),
      });
    }
    if (query === api.drafts.updateDraft) {
      const draft = state.drafts[args.draftId];
      update({
        drafts: {
          ...state.drafts,
          [args.draftId]: {
            ...draft,
            versions: {
              ...draft.versions,
              [args.platform]: args.content,
            },
          },
        },
      });
    }
    if (query === api.streams.abortStreamByOrder) {
      clearTimeout(pending.get(args.threadId));
      pending.delete(args.threadId);
      update({
        messages: {
          ...state.messages,
          [args.threadId]: (state.messages[args.threadId] ?? []).map((m) => ({
            ...m,
            status: 'success',
          })),
        },
      });
    }
    if (query === api.chats.sendMessage) {
      const { prompt, threadId } = args;
      const previous = state.messages[threadId] ?? [];
      const order = previous.length;
      const user: UIMessage = {
        id: crypto.randomUUID(),
        key: crypto.randomUUID(),
        order,
        parts: [{ type: 'text', text: prompt }],
        role: 'user',
        status: 'success',
        text: prompt,
      };
      const assistant: UIMessage = {
        id: crypto.randomUUID(),
        key: crypto.randomUUID(),
        order: order + 1,
        parts: [],
        role: 'assistant',
        status: 'streaming',
        text: '',
      };
      update({
        chats: state.chats.map((c) =>
          c._id === threadId
            ? {
                ...c,
                title: prompt.slice(0, 60),
              }
            : c,
        ),
        messages: {
          ...state.messages,
          [threadId]: [...previous, user, assistant],
        },
      });
      const answer = reply(
        prompt,
        previous.map((m) => ({
          role: m.role,
          stage: (m as any).stage,
          text: m.text,
        })),
        args.locale,
      );
      const patch = (fn: (m: UIMessage) => UIMessage, extra: Partial<typeof initial> = {}) => {
        update({
          ...extra,
          messages: {
            ...state.messages,
            [threadId]: (state.messages[threadId] ?? []).map((m) =>
              m.id === assistant.id ? fn(m) : m,
            ),
          },
        });
      };
      const words = answer.text.match(/\S+\s*/g) ?? [];
      let shown = 0;
      const tick = () => {
        shown = Math.min(words.length, shown + 1 + Math.floor(Math.random() * 3));
        const text = words.slice(0, shown).join('');
        if (shown < words.length) {
          patch((m) => ({
            ...m,
            parts: [{ type: 'text', text }],
            text,
          }));
          pending.set(threadId, setTimeout(tick, 25 + Math.random() * 35));
          return;
        }
        if (!answer.versions) {
          patch(
            (m) =>
              ({
                ...m,
                parts: [{ type: 'text', text }],
                stage: answer.stage,
                status: 'success',
                text,
              }) as UIMessage,
          );
          pending.delete(threadId);
          return;
        }
        const draftId = crypto.randomUUID();
        patch((m) => ({
          ...m,
          parts: [
            { type: 'text', text },
            { type: 'tool-get-draft', input: {}, state: 'input-available' },
          ],
          text,
        }));
        pending.set(
          threadId,
          setTimeout(() => {
            patch(
              (m) =>
                ({
                  ...m,
                  parts: [
                    { type: 'text', text },
                    {
                      type: 'tool-get-draft',
                      input: {},
                      output: draftId,
                      state: 'output-available',
                    },
                  ],
                  stage: answer.stage,
                  status: 'success',
                }) as UIMessage,
              {
                drafts: {
                  ...state.drafts,
                  [draftId]: {
                    _id: draftId,
                    versions: answer.versions,
                  },
                },
              },
            );
            pending.delete(threadId);
          }, 900),
        );
      };
      pending.set(threadId, setTimeout(tick, 500 + Math.random() * 300));
    }
  };
  return Object.assign(mutate, { withOptimisticUpdate: () => mutate });
}
export const optimisticallySendMessage =
  (..._args: any[]) =>
  () => {};
export const optimisticallyUpdateDraft = () => {};
export function useSmoothText(text: string, _options?: any) {
  return [text];
}
export const SECOND = 1000;
export const isRateLimitError = (_error: unknown) => false;
export function useRateLimit(_query: any) {
  return {
    check: (_now?: number, _count?: number) => ({ value: 50 }),
    status: { retryAt: undefined as number | undefined },
  };
}
export const authClient = {
  signIn: {
    anonymous: async () => ({ error: null }),
    social: async (_args?: any) => {
      update({
        user: {
          ...state.user,
          tier: 'free',
        },
      });
    },
  },
};
export const checkout = async (_args?: any) => {
  update({
    user: {
      ...state.user,
      tier: 'pro',
    },
  });
};
export const customer = {
  portal: async () => {
    update({
      user: {
        ...state.user,
        tier: 'free',
      },
    });
  },
};
export const signOut = async () => {
  update({
    path: '/',
    user: { ...state.user, tier: 'anonymous' },
  });
};
export function mockPost(platform: string, content: string) {
  try {
    localStorage.setItem(
      'crosspost-last-post',
      JSON.stringify({
        content,
        createdAt: Date.now(),
        platform,
      }),
    );
  } catch {}
}
