import { FeedbacksDataTable } from '@remark/components/FeedbacksDataTable';
import { FeedbacksTableSkeleton } from '@remark/components/FeedbacksTableSkeleton';
import { PageTitle } from '@remark/components/PageTitle';
import { getFeedbacks } from '@remark/lib/db/queries';
import React from 'react';

export default function FeedbacksPage() {
  return (
    <>
      <PageTitle title="Feedbacks" />
      <React.Suspense fallback={<FeedbacksTableSkeleton />}>
        <FeedbacksTable />
      </React.Suspense>
    </>
  );
}

function FeedbacksTable() {
  const result = getFeedbacks({ cursor: undefined });
  return <FeedbacksDataTable data={result.data.feedbacks} />;
}
