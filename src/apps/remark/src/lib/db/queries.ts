import { getDatabase } from '@remark/adapters/database';
export function getFeedbacks(_input: { cursor?: string }) {
  return {
    data: {
      feedbacks: getDatabase().feedbacks,
      hasMore: false,
      nextCursor: undefined,
    },
  };
}
