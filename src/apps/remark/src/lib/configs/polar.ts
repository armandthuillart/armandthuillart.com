import { getDatabase } from '@remark/adapters/database';
export const polarClient = {
  customers: {
    getStateExternal: (_options?: unknown) => {
      const db = getDatabase();
      return {
        activeSubscriptions:
          db.plan === 'free'
            ? []
            : [
                {
                  cancelAtPeriodEnd: db.cancelAtPeriodEnd,
                  currentPeriodEnd: new Date(Date.now() + 86400000 * 15),
                  productId: db.plan,
                  startedAt: new Date(Date.now() - 86400000 * 15),
                  status: 'active',
                },
              ],
      };
    },
  },
};
