import { changeDatabase, getDatabase, useDatabase } from '@remark/adapters/database';
import { navigate } from '@remark/adapters/navigation';
interface Callbacks {
  onError?: (result?: unknown) => void;
  onSuccess?: (result?: unknown) => void;
}
interface Result<T = undefined> {
  data?: T;
  error: null | { message: string };
}
const success = <T>(data?: T): Promise<Result<T>> =>
  Promise.resolve({
    data,
    error: null,
  });
export const authClient = {
  changeEmail: ({ newEmail }: { newEmail: string }) => {
    changeDatabase((db) => {
      db.user.email = newEmail;
    });
    return success();
  },
  checkout: ({ slug }: { slug: 'free' | 'plus' | 'pro' }) => {
    changeDatabase((db) => {
      db.plan = slug;
      db.cancelAtPeriodEnd = false;
      db.billingPortalOpen = false;
    });
    navigate('/settings/billing');
    return success();
  },
  customer: {
    portal: () => {
      changeDatabase((db) => {
        db.billingPortalOpen = true;
      });
      return success();
    },
  },
  deleteUser: (options: { callbackURL?: string; fetchOptions?: Callbacks }) => {
    changeDatabase((db) => {
      db.signedIn = false;
      db.feedbacks = [];
      db.contacts = [];
      db.votes = [];
      db.keys = [];
      db.accounts = [];
      db.passkeys = [];
    });
    options.fetchOptions?.onSuccess?.();
    navigate('/sign-up');
    return success();
  },
  linkSocial: ({ provider }: { callbackURL?: string; provider: string }) => {
    changeDatabase((db) => {
      if (!db.accounts.some((a) => a.provider === provider))
        db.accounts.push({
          accountId: db.user.id,
          createdAt: new Date(),
          id: crypto.randomUUID(),
          provider,
        });
    });
    return success();
  },
  listAccounts: () => success(getDatabase().accounts),
  passkey: {
    addPasskey: () => {
      changeDatabase((db) => {
        const id = crypto.randomUUID();
        db.passkeys.push({
          createdAt: new Date(),
          credentialID: id,
          id,
          name: 'Local passkey',
        });
      });
      return success();
    },
    deletePasskey: ({ id }: { id: string }) => {
      changeDatabase((db) => {
        db.passkeys = db.passkeys.filter((key) => key.id !== id);
      });
      return success();
    },
    listUserPasskeys: () => success(getDatabase().passkeys),
  },
  signIn: {
    magicLink: ({ email }: { email: string }) => {
      changeDatabase((db) => {
        db.user.email = email;
        db.signedIn = true;
      });
      setTimeout(() => {
        navigate('/');
      }, 1500);
      return success();
    },
    passkey: (options: { autoFill?: boolean; fetchOptions?: Callbacks }) => {
      if (!options.autoFill) {
        changeDatabase((db) => {
          db.signedIn = true;
        });
        options.fetchOptions?.onSuccess?.();
      }
      return success();
    },
    social: (_options: { provider: string }) => {
      changeDatabase((db) => {
        db.signedIn = true;
      });
      navigate('/');
      return success();
    },
  },
  signOut: (options: { fetchOptions?: Callbacks } = {}) => {
    changeDatabase((db) => {
      db.signedIn = false;
    });
    options.fetchOptions?.onSuccess?.();
    return success();
  },
  unlinkAccount: ({ providerId }: { providerId: string }) => {
    changeDatabase((db) => {
      db.accounts = db.accounts.filter((account) => account.provider !== providerId);
    });
    return success();
  },
  useSession() {
    const db = useDatabase();
    return {
      data: db.signedIn ? { user: db.user } : null,
      isPending: false,
    };
  },
};
