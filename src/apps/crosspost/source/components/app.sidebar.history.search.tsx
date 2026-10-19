'use client';

import {
  useHistorySearch,
  useMutation,
  useParams,
  useTranslations,
  useRouter,
  api,
} from '../local/runtime';
import type { ParamsOf } from '../local/runtime';
import { Button } from './ui/button';
import { SearchIcon, TrashIcon } from './ui/icons';

export function SibebarHistorySearch({
  hasThreadIds,
  setThreadIds,
  threadIds,
}: {
  hasThreadIds: boolean;
  setThreadIds: (threadIds: string[] | null) => void;
  threadIds: string[] | null;
}) {
  const router = useRouter();
  const [search, setSearch] = useHistorySearch();
  const t = useTranslations('SidebarHistorySearch');

  const { chatId } = useParams<ParamsOf<'/[locale]/chat/[chatId]'>>();

  const deleteChats = useMutation(api.chats.deleteChats).withOptimisticUpdate(
    (
      localStore: {
        getQuery: (
          ...args: unknown[]
        ) =>
          | import('../local/runtime').PaginationResult<import('../local/runtime').ThreadDoc>
          | undefined;
        setQuery: (...args: unknown[]) => void;
      },
      { threadIds }: { threadIds: string[] },
    ) => {
      const currentChats = localStore.getQuery(api.chats.listChats, {
        paginationOpts: {
          cursor: null,
          numItems: 10,
        },
      });

      if (currentChats !== undefined) {
        const updatedResults = {
          ...currentChats,
          page: currentChats.page.filter(({ _id: chatId }) => !threadIds.includes(chatId)),
        };

        localStore.setQuery(
          api.chats.listChats,
          {
            paginationOpts: {
              cursor: null,
              numItems: 10,
            },
          },
          updatedResults,
        );
      }
    },
  );

  async function handleDelete() {
    if (!threadIds) return;

    const shouldNavigate = chatId && threadIds.includes(chatId);

    void deleteChats({ threadIds });
    setThreadIds(null);

    if (shouldNavigate) {
      router.push('/');
    }
  }

  return (
    <div className="relative flex w-full items-center gap-3">
      <div className="flex w-full items-center gap-2 pl-2.5 text-muted-foreground">
        <div className="my-2 flex size-5 shrink-0 items-center justify-center">
          <SearchIcon className="size-4 shrink-0" />
        </div>

        <input
          className="w-full text-sm text-foreground outline-none placeholder:text-muted-foreground"
          onChange={(event) => {
            setSearch(event.currentTarget.value);
          }}
          placeholder={t('search')}
          value={search}
        />
      </div>

      {hasThreadIds && (
        <Button
          className="hover:bg-destructive hover:text-destructive-foreground shrink-0 text-muted-foreground"
          onClick={handleDelete}
          size="icon"
          variant="ghost"
        >
          <TrashIcon className="size-5" />
        </Button>
      )}
    </div>
  );
}
