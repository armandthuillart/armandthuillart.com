'use client';

import { useState } from 'react';

import { appName } from '../lib/constants';
import {
  type Preloaded,
  usePreloadedQuery,
  useTranslations,
  usePathname,
  useRouter,
} from '../local/runtime';
import type { api } from '../local/runtime';
import { AppMenu } from './app.menu';
import { SibebarHistory } from './app.sidebar.history';
import { SibebarHistorySearch } from './app.sidebar.history.search';
import { Button } from './ui/button';
import { AppIcon } from './ui/icons';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';

export function AppSidebar({
  preloadedChats,
  preloadedUser,
}: {
  preloadedChats: Preloaded<typeof api.chats.listChats>;
  preloadedUser: Preloaded<typeof api.auth.getUser>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const chats = usePreloadedQuery(preloadedChats);
  const user = usePreloadedQuery(preloadedUser);
  const t = useTranslations('AppSidebar');

  const [threadIds, setThreadIds] = useState<null | string[]>(null);
  const hasThreadIds = Boolean(threadIds);

  return (
    <Sidebar>
      <SidebarHeader>
        <SibebarHistorySearch
          hasThreadIds={Boolean(threadIds)}
          setThreadIds={setThreadIds}
          threadIds={threadIds}
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={pathname === '/'}
                  onClick={() => {
                    router.push('/');
                  }}
                >
                  <AppIcon className="text-primary size-5" />
                  {appName}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="justify-between">
            {t('chats')}
            {hasThreadIds && (
              <Button
                className="not-hover:text-muted-foreground"
                onClick={() => {
                  if (threadIds && threadIds.length === chats?.page.length) {
                    setThreadIds(null);
                  } else {
                    setThreadIds(
                      chats?.page.map(({ _id: chatId }: { _id: string }) => chatId) || [],
                    );
                  }
                }}
                variant="link"
              >
                {threadIds && threadIds.length === chats?.page.length ? t('clear') : t('all')}
              </Button>
            )}
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              <SibebarHistory chats={chats} setThreadIds={setThreadIds} threadIds={threadIds} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <AppMenu user={user ?? null} />
      </SidebarFooter>
    </Sidebar>
  );
}
