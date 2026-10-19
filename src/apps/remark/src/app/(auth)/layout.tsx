import { AuthNav } from '@remark/components/AuthNav';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AuthNav />
      <div className="container max-w-lg!">
        <div className="flex min-h-dvh items-center justify-center py-8">
          <main className="w-full pt-8">
            <div className="flex flex-col gap-4">{children}</div>
          </main>
        </div>
      </div>
    </>
  );
}
