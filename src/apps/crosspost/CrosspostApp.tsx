import { Response } from './source/components/ai-elements/response';
import { AppLegalDocumentsClient } from './source/components/app.legal-documents.client';
import { AppShortcuts } from './source/components/app.shortcuts';
import { AppSidebar } from './source/components/app.sidebar';
import { Chat } from './source/components/chat';
import { SidebarProvider } from './source/components/ui/sidebar';
import legal from './source/local/legal.json';
import { LocalProvider, api, useLocale, usePreloadedQuery } from './source/local/runtime';
import '@fontsource-variable/geist';
import '@fontsource-variable/geist-mono';

import './crosspost.css';
export default function CrosspostApp({ locale = 'en' }: { locale?: string }) {
  return (
    <LocalProvider locale={locale}>
      <Workspace />
    </LocalProvider>
  );
}

function LegalDocuments() {
  const locale = useLocale();
  const pages = legal[locale === 'fr' ? 'fr' : 'en'].map((page) => ({
    ...page,
    body: <Response>{page.body}</Response>,
  }));
  return <AppLegalDocumentsClient pages={pages} />;
}

function Workspace() {
  const user = usePreloadedQuery(api.auth.getUser);
  const isSignedIn = user && user.tier !== 'anonymous';
  return (
    <SidebarProvider defaultOpen={true}>
      <LegalDocuments />
      <AppShortcuts />
      {isSignedIn && (
        <AppSidebar preloadedChats={api.chats.listChats} preloadedUser={api.auth.getUser} />
      )}
      <Chat initialMessages={[]} preloadedUser={api.auth.getUser} userLocation={{}} />
    </SidebarProvider>
  );
}
