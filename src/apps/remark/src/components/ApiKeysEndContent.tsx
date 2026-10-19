'use client';

import { Button } from '@remark/components/ui/Button';
import { useApiKeyStore } from '@remark/lib/api-key-store';
import { PlusIcon } from 'lucide-react';

export function ApiKeysEndContent({ hasApiKeys }: { hasApiKeys: boolean }) {
  const { setOpen } = useApiKeyStore();

  if (hasApiKeys) {
    return (
      <Button
        onClick={() => {
          setOpen('create');
        }}
        size="sm"
      >
        <PlusIcon size={16} />
        Create API Key
      </Button>
    );
  }
}
