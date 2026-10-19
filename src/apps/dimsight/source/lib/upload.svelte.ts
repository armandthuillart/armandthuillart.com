import { onDestroy } from 'svelte';

import { getBackend } from '../mock/backend.svelte';
export type Uploader = ReturnType<typeof createUploader>;
export type UploadItem = {
  source: { file?: File; modifiedAt: number; name: string; versionId: string; size: number };
  progress: number;
  phase?: string;
  errorMessage?: string;
  status: 'waiting' | 'queued' | 'uploading' | 'converting' | 'completed' | 'error';
};
export function createUploader(isEnabled: () => boolean) {
  const backend = getBackend();
  const files = $state<UploadItem[]>([]);
  const timers = new Map<UploadItem, ReturnType<typeof setInterval>>();
  function start(item: UploadItem) {
    item.status = 'uploading';
    item.progress = 0;
    const timer = setInterval(() => {
      item.progress = Math.min(100, item.progress + 10);
      if (item.progress >= 50) {
        item.status = 'converting';
        item.phase = 'processing';
      }
      if (item.progress === 100) {
        clearInterval(timer);
        timers.delete(item);
        backend.completeFixtureUpload(item.source.versionId, item.source.name);
        item.status = 'completed';
      }
    }, 180);
    timers.set(item, timer);
  }
  onDestroy(() => {
    for (const timer of timers.values()) clearInterval(timer);
  });
  return {
    addFiles({ versionId }: { versionId: string }, selected: File[]) {
      if (!isEnabled()) return;
      for (const file of selected) {
        files.push({
          source: {
            file,
            versionId,
            name: file.name,
            size: file.size,
            modifiedAt: file.lastModified,
          },
          progress: 0,
          status: 'queued',
        });
        start(files.at(-1)!);
      }
    },
    async cancel(item: UploadItem) {
      clearInterval(timers.get(item));
      timers.delete(item);
      const i = files.indexOf(item);
      if (i >= 0) files.splice(i, 1);
    },
    get files() {
      return files;
    },
    async retry(item: UploadItem) {
      clearInterval(timers.get(item));
      start(item);
    },
  };
}
