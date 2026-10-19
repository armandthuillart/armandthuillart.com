import { PageTitle } from '@remark/components/PageTitle';
import { SettingsTabs } from '@remark/components/SettingsTabs';

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageTitle title="Settings" />
      <div className="flex flex-col gap-3 md:gap-6">
        <SettingsTabs />
        {children}
      </div>
    </>
  );
}
