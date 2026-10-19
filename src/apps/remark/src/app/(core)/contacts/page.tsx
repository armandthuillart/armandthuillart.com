import { getContacts, getFeedbacks } from '@remark/adapters/database';
import { ContactsDataTable } from '@remark/components/ContactsDataTable';
import { ContactsTableSkeleton } from '@remark/components/ContactsTableSkeleton';
import { EngagementChart } from '@remark/components/EngagementChart';
import { PageIcon } from '@remark/components/PageIcon';
import { endOfWeek, format, isWithinInterval, startOfWeek, subMonths, subWeeks } from 'date-fns';
import { SquareUser } from 'lucide-react';
import React, { Suspense } from 'react';

export default function ContactsPage() {
  return (
    <div className="container">
      <div className="py-8">
        <div className="flex flex-col items-center gap-6 md:flex-row">
          <PageIcon Icon={SquareUser} size="lg" />
          <div className="text-center md:text-left">
            <span className="text-sm font-semibold text-muted-foreground">Segments</span>
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          </div>
        </div>

        <Suspense fallback={<ContactsTableSkeleton />}>
          <Insights />
        </Suspense>
      </div>
    </div>
  );
}

function Insights() {
  const contacts = getContacts();

  // 2. Metadata can only contains the contact's tier
  // So we assume that if metadata is null/undefined, the contact is a free user
  // And if metadata.tier is defined, and is not "free", it's a paying user
  const paying = contacts.filter((c) => c.metadata?.tier && c.metadata.tier !== 'free').length;
  const free = contacts.filter((c) => !c.metadata?.tier || c.metadata.tier === 'free').length;

  // 3. For the chart, we count how many contacts sent feedback in the last month and make 4 slices, one for each week.
  const [now] = React.useState(() => new Date());
  const oneMonthAgo = subMonths(now, 1);
  const feedbacks = getFeedbacks().filter((item) => item.createdAt >= oneMonthAgo);

  // Get the start of the current week (Monday)
  const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
  // Generate last 4 week ranges (from oldest to newest)
  const weekRanges = Array.from({ length: 4 }, (_, i) => {
    const start = startOfWeek(subWeeks(currentWeekStart, 3 - i), { weekStartsOn: 1 });
    const end = endOfWeek(start, { weekStartsOn: 1 });
    return {
      end,
      start,
    };
  });

  // Aggregate feedbacks into week buckets
  const chartData = weekRanges.map(({ end, start }) => {
    const value = feedbacks.filter((fb) =>
      isWithinInterval(fb.createdAt, {
        end,
        start,
      }),
    ).length;
    const range = `${format(start, 'd MMM')} – ${format(end, 'd MMM')}`;
    return {
      range,
      value,
    };
  });

  return (
    <>
      <div className="mb-8 grid w-full grid-cols-2 justify-between gap-y-4 pt-12 pb-4 md:grid-cols-4">
        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground uppercase">All contacts</div>
          <span className="text-2xl tracking-tight">{contacts.length}</span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground uppercase">Paying users</div>
          <span className="text-2xl tracking-tight">{paying}</span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground uppercase">Free users</div>
          <span className="text-2xl tracking-tight">{free}</span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground uppercase">Engagement</div>
          <div className="h-8">
            <EngagementChart data={chartData} />
          </div>
        </div>
      </div>

      <ContactsDataTable data={contacts} />
    </>
  );
}
