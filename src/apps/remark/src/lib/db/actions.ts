import { changeDatabase } from '@remark/adapters/database';
import type { FeedbackMetadata } from '@remark/lib/schema';
function createApiKeySync({ name }: { name: string; pathname?: string }) {
  if (!name.trim() || name.trim().length > 50)
    return { data: { failure: 'Name must contain between 1 and 50 characters.' } };
  const key = `re_local_${crypto.randomUUID().replaceAll('-', '')}`;
  const apiKey = {
    createdAt: new Date(),
    id: crypto.randomUUID(),
    key,
    lastRequest: null,
    name: name.trim(),
    requestCount: 0,
    start: key.slice(0, 8),
  };
  changeDatabase((db) => {
    db.keys.push(apiKey);
  });
  return { data: { apiKey } };
}
function createFeedbackSync({ metadata, text }: { metadata?: FeedbackMetadata; text: string }) {
  if (text.trim().length < 2 || text.length > 2000)
    return { data: { failure: 'Feedback must contain between 2 and 2000 characters.' } };
  changeDatabase((db) => {
    db.feedbacks.unshift({
      createdAt: new Date(),
      from: db.user.email,
      id: crypto.randomUUID(),
      impact: 'minor',
      metadata,
      subject: text.trim().split(/\s+/).slice(0, 6).join(' '),
      summary: [text],
      tags: ['feature_request'],
      text,
      updatedAt: new Date(),
    });
  });
  return { data: { success: true } };
}
function deleteApiKeySync({ keyId }: { keyId: string }): {
  data: { failure?: string; success?: boolean };
} {
  changeDatabase((db) => {
    db.keys = db.keys.filter((key) => key.id !== keyId);
  });
  return { data: { success: true } };
}
function updateApiKeySync({ keyId, newName }: { keyId: string; newName: string }) {
  if (!newName.trim() || newName.trim().length > 50)
    return { data: { failure: 'Name must contain between 1 and 50 characters.' } };
  changeDatabase((db) => {
    const key = db.keys.find((key) => key.id === keyId);
    if (key) key.name = newName.trim();
  });
  return { data: { success: true } };
}
export const createApiKey = (input: Parameters<typeof createApiKeySync>[0]) =>
  Promise.resolve(createApiKeySync(input));
export const createFeedback = (input: Parameters<typeof createFeedbackSync>[0]) =>
  Promise.resolve(createFeedbackSync(input));
export const deleteApiKey = (input: Parameters<typeof deleteApiKeySync>[0]) =>
  Promise.resolve(deleteApiKeySync(input));
export const updateApiKey = (input: Parameters<typeof updateApiKeySync>[0]) =>
  Promise.resolve(updateApiKeySync(input));
