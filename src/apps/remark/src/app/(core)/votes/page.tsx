import { getVotes } from '@remark/adapters/database';
import { PageTitle } from '@remark/components/PageTitle';
import { VotesDataTable } from '@remark/components/VotesDataTable';
import { Suspense } from 'react';

export default function VotesPage() {
  return (
    <>
      <PageTitle title="Votes" />
      <Suspense>
        <Table />
      </Suspense>
    </>
  );
}

function Table() {
  const votes = getVotes();

  return <VotesDataTable data={votes} />;
}
