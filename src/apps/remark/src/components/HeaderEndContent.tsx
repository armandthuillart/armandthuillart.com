'use client';

import { useDatabase } from '@remark/adapters/database';

import { HeaderAuthButtons } from './HeaderAuthButtons';

export function HeaderEndContent() {
  const { signedIn } = useDatabase();

  return <HeaderAuthButtons isSignedIn={signedIn} />;
}
