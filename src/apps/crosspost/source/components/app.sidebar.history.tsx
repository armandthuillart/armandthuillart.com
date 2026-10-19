import type { MouseEvent } from 'react';

import type { ThreadDoc, PaginationResult, ParamsOf } from '../local/runtime';
import { useParams } from '../local/runtime';
import { useRouter } from '../local/runtime';
import { Checkbox } from './ui/checkbox';
import { SidebarMenuButton, SidebarMenuItem } from './ui/sidebar';

export function SibebarHistory({
  chats,
  setThreadIds,
  threadIds,
}: {
  chats: PaginationResult<ThreadDoc>;
  setThreadIds: (threadIds: string[] | null) => void;
  threadIds: string[] | null;
}) {
  const { chatId: paramsChatId } = useParams<ParamsOf<'/[locale]/chat/[chatId]'>>();
  const router = useRouter();

  function handleSelect(e: MouseEvent<HTMLButtonElement>, chatId: string) {
    e.stopPropagation();

    const currentIds = threadIds || [];

    const newIds = currentIds.includes(chatId)
      ? currentIds.filter((id) => id !== chatId)
      : [...currentIds, chatId];

    setThreadIds(newIds.length > 0 ? newIds : null);
  }

  return chats.page.map(({ _id: chatId, title }) => (
    <SidebarMenuItem key={chatId}>
      <SidebarMenuButton
        className="group-hover/menu-item:bg-sidebar-accent/70 group-has-data-[state=checked]/menu-item:bg-sidebar-accent/70 justify-between"
        isActive={chatId === paramsChatId}
        onClick={() => {
          router.push(`/chat/${chatId}`);
        }}
      >
        <span className="truncate">{title}</span>
      </SidebarMenuButton>

      <Checkbox
        checked={threadIds?.includes(chatId) || false}
        className="absolute top-2.5 right-3 bg-background not-data-[state=checked]:opacity-0 group-hover/menu-item:opacity-100"
        onClick={(e) => {
          handleSelect(e, chatId);
        }}
      />
    </SidebarMenuItem>
  ));
}
