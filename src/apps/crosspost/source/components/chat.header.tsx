'use client';

import { useTranslations, useRouter, authClient } from '../local/runtime';
import { CTA } from './chat.header.upgrade-cta';
import { Button } from './ui/button';
import { AppIcon } from './ui/icons';
import { SidebarTrigger } from './ui/sidebar';

interface ChatHeaderProps {
  isAnonymous: boolean;
  isChat: boolean;
  isFree: boolean;
}

export function ChatHeader({ isAnonymous, isChat, isFree }: ChatHeaderProps) {
  const router = useRouter();
  const t = useTranslations('ChatHeader');

  async function handleSignInWithGoogle() {
    await authClient.signIn.social({ provider: 'google' });
  }

  if (isAnonymous) {
    return (
      <header className="@max-8xl/chat:sticky @max-8xl/chat:group-data-chat/chat:bg-background absolute inset-0 bottom-auto z-50 flex w-full items-center justify-between p-2 group-not-data-chat/chat:justify-end">
        <Button
          className="group/trigger group-not-data-chat/chat:hidden"
          onClick={() => {
            router.push('/');
          }}
          size="icon"
          variant="ghost"
        >
          <AppIcon className="size-6" />
        </Button>

        <div className="flex items-center gap-2">
          <Button className="rounded-full" onClick={handleSignInWithGoogle} variant="secondary">
            {t('signIn')}
          </Button>

          <Button className="rounded-full" onClick={handleSignInWithGoogle}>
            {t('signUp')}
          </Button>
        </div>
      </header>
    );
  }

  return (
    <header className="@max-8xl/chat:group-data-chat/chat:bg-background absolute inset-0 bottom-auto z-50 flex items-center justify-between p-2">
      <SidebarTrigger />
      {!isChat && isFree && <CTA />}
    </header>
  );
}
