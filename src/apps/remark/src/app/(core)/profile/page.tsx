import { DeleteAccount } from '@remark/components/DeleteAccount';
import { EmailAddress } from '@remark/components/EmailAddress';
import { PageTitle } from '@remark/components/PageTitle';
import { SignInMethods } from '@remark/components/SignInMethods';

export default function ProfilePage() {
  return (
    <>
      <PageTitle title="Profile" />
      <main className="container">
        <div className="flex flex-col gap-4">
          <EmailAddress />
          <SignInMethods />
          <DeleteAccount />
        </div>
      </main>
    </>
  );
}
