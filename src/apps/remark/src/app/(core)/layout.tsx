import { DashboardHeader } from '@remark/components/DashboardHeader';
import { DashboardSidebar } from '@remark/components/DashboardSidebar';

export default function CoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex">
      <DashboardSidebar />
      <div className="flex-1 overflow-hidden">
        <DashboardHeader />
        <div className="h-[calc(100dvh-4rem)] overflow-auto pb-10">{children}</div>
      </div>
    </div>
  );
}
