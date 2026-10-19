import { headers } from '@remark/adapters/headers';
import { apiKeysColumns } from '@remark/components/ApiKeysColumns';
import { ApiKeysDataTable } from '@remark/components/ApiKeysDataTable';
import { ApiKeysEndContent } from '@remark/components/ApiKeysEndContent';
import { ApiKeysTableSkeleton } from '@remark/components/ApiKeysTableSkeleton';
import { CreateApiKeyDialog } from '@remark/components/CreateApiKeyDialog';
import { DeleteApiKeyDialog } from '@remark/components/DeleteApiKeyDialog';
import { PageTitle } from '@remark/components/PageTitle';
import { UpdateApiKeyDialog } from '@remark/components/UpdateApiKeyDialog';
import { ViewApiKeyValueDialog } from '@remark/components/ViewApiKeyValueDialog';
import type { ApiKey } from '@remark/lib/api-key-types';
import { auth } from '@remark/lib/auth';
import { Suspense } from 'react';

export default function ApiKeys() {
  return (
    <>
      <CreateApiKeyDialog />
      <ViewApiKeyValueDialog />
      <DeleteApiKeyDialog />
      <Suspense fallback={<ApiKeysTableSkeleton />}>
        <Table />
      </Suspense>
    </>
  );
}

function getApiKeys(): ApiKey[] {
  const apiKeys = auth.api.listApiKeys({ headers: headers() });

  return apiKeys.map((key) => ({
    createdAt: key.createdAt,
    id: key.id,
    lastRequest: key.lastRequest,
    name: key.name,
    start: key.start,
  }));
}

function Table() {
  const apiKeys = getApiKeys();

  return (
    <>
      <PageTitle
        endContent={<ApiKeysEndContent hasApiKeys={apiKeys.length > 0} />}
        title="API Keys"
      />
      <UpdateApiKeyDialog apiKeys={apiKeys} />
      <ApiKeysDataTable columns={apiKeysColumns} data={apiKeys} />
    </>
  );
}
