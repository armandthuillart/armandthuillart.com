import { changeDatabase, useDatabase } from '@remark/adapters/database';
import { usePathname } from '@remark/adapters/navigation';
import AuthLayout from '@remark/app/(auth)/layout';
import SignIn from '@remark/app/(auth)/sign-in/page';
import SignUp from '@remark/app/(auth)/sign-up/page';
import ApiKeys from '@remark/app/(core)/api-keys/page';
import Contacts from '@remark/app/(core)/contacts/page';
import FeedbackDetail from '@remark/app/(core)/feedbacks/[id]/page';
import Feedbacks from '@remark/app/(core)/feedbacks/page';
import CoreLayout from '@remark/app/(core)/layout';
import Profile from '@remark/app/(core)/profile/page';
import Billing from '@remark/app/(core)/settings/billing/page';
import SettingsLayout from '@remark/app/(core)/settings/layout';
import Usage from '@remark/app/(core)/settings/usage/page';
import Votes from '@remark/app/(core)/votes/page';
import DocsNext from '@remark/app/(public)/(docs)/docs/next/page';
import DocsNode from '@remark/app/(public)/(docs)/docs/node/page';
import Docs from '@remark/app/(public)/(docs)/docs/page';
import DocsLayout from '@remark/app/(public)/(docs)/layout';
import Home from '@remark/app/(public)/(marketing)/(home)/home/page';
import ProductLayout from '@remark/app/(public)/layout';
import { ThemeProvider } from '@remark/components/ThemeProvider';
import { UpdatePlanDialog } from '@remark/components/UpdatePlanDialog';
import type { ReactElement } from 'react';
import { Toaster } from 'sonner';
import '@fontsource-variable/inter';

import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './app.css';

export default function RemarkApp() {
  return (
    <ThemeProvider>
      <div className="remark-app">
        <Screen />
        <Toaster className="[--width:420px]!" />
      </div>
    </ThemeProvider>
  );
}
function Screen() {
  const path = usePathname();
  const database = useDatabase();
  if (path === '/sign-in' || path === '/sign-up')
    return <AuthLayout>{path === '/sign-up' ? <SignUp /> : <SignIn />}</AuthLayout>;
  if (path.startsWith('/docs')) {
    const docsPages: Record<string, ReactElement> = {
      '/docs/next': <DocsNext />,
      '/docs/node': <DocsNode />,
    };
    const docs = docsPages[path] ?? <Docs />;
    return (
      <ProductLayout>
        <DocsLayout>{docs}</DocsLayout>
      </ProductLayout>
    );
  }
  if (path === '/home' || (path === '/' && !database.signedIn))
    return (
      <ProductLayout>
        <Home />
      </ProductLayout>
    );
  if (!database.signedIn)
    return (
      <AuthLayout>
        <SignIn />
      </AuthLayout>
    );
  let page = <Feedbacks />;
  if (path.startsWith('/feedbacks/'))
    page = <FeedbackDetail params={{ id: decodeURIComponent(path.split('/')[2]) }} />;
  else if (path === '/contacts') page = <Contacts />;
  else if (path === '/votes') page = <Votes />;
  else if (path === '/api-keys') page = <ApiKeys />;
  else if (path === '/profile') page = <Profile />;
  else if (path.startsWith('/settings'))
    page = (
      <SettingsLayout>{path === '/settings/billing' ? <Billing /> : <Usage />}</SettingsLayout>
    );
  return (
    <>
      <CoreLayout>{page}</CoreLayout>
      {database.billingPortalOpen && (
        <UpdatePlanDialog
          currentPlan={database.plan}
          onOpenChange={(open) => {
            if (!open)
              changeDatabase((db) => {
                db.billingPortalOpen = false;
              });
          }}
          open
        />
      )}
    </>
  );
}
