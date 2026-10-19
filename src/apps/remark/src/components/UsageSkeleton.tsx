import { Button } from '@remark/components/ui/Button';
import { Skeleton } from '@remark/components/ui/Skeleton';
import { APP_NAME } from '@remark/lib/constants';

export function UsageSkeleton() {
  return (
    <main className="container">
      {['1', '2'].map((key) => (
        <UsageCard
          description={
            key === '1'
              ? `Integrate feedback into your app using the ${APP_NAME} API.`
              : "Know who's behind the feedback and segment them."
          }
          key={key}
          limits={
            key === '1'
              ? [{ title: 'Monthly limit' }, { title: 'Daily limit' }]
              : [{ title: 'Contacts limit' }, { title: 'Segments limit' }]
          }
          title={key === '1' ? 'External' : 'Internal'}
        />
      ))}
    </main>
  );
}

function UsageCard({
  description,
  limits,
  title,
}: {
  description: string;
  limits: { title: string; total?: number; used?: number }[];
  title: string;
}) {
  return (
    <div className="border-slate-4 flex flex-col border-b py-4 md:flex-row md:pt-8 md:pb-16">
      <div className="flex w-full justify-between md:block md:w-1/2">
        <h2 className="mb-1 text-xl font-bold tracking-tight">{title}</h2>
        <span className="mb-4 hidden text-sm text-muted-foreground md:block md:w-1/2">
          {description}
        </span>
        <Button loading size="sm">
          Upgrade
        </Button>
      </div>
      <div className="w-full md:w-1/2">
        <Skeleton className="mb-2 h-4 w-10" />
        <div className="relative w-full overflow-x-auto overflow-y-hidden">
          <table className="m-0 mb-2 w-max min-w-full border-separate border-spacing-0 border-none p-0 py-4 text-left md:w-full">
            <tbody>
              {limits.map((limit) => (
                <tr key={limit.title}>
                  <td className="h-10 w-8 overflow-hidden border-b px-0 text-center text-sm text-ellipsis whitespace-nowrap">
                    <svg className="flip -mt-px rotate-180" height="22" width="22">
                      <title>Usage</title>
                      <circle
                        className="text-muted"
                        cx={11}
                        cy={11}
                        fill="transparent"
                        r={8}
                        stroke="currentColor"
                        strokeWidth={3}
                      />
                    </svg>
                  </td>
                  <td className="h-10 w-3/5 overflow-hidden border-b px-0 py-3.5 text-sm text-ellipsis whitespace-nowrap">
                    {limit.title}
                  </td>
                  <td className="h-10 overflow-hidden border-b px-0 text-right text-sm text-ellipsis whitespace-nowrap">
                    <Skeleton className="ml-auto h-4 w-20" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
