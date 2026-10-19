import { getDatabase } from '@remark/adapters/database';
export const auth = {
  api: {
    getSession: (_options?: unknown) => ({ user: getDatabase().user }),
    listApiKeys: (_options?: unknown) => getDatabase().keys,
  },
};
