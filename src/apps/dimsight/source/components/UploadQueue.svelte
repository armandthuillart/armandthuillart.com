<script lang="ts">
  import Sprite from '../lib/components/Sprite.svelte';
  import type { UploadItem as File } from '../lib/upload.svelte.ts';
  import ProgressRing from './ProgressRing.svelte';

  interface Props {
    cancel: (file: File) => void;
    closed: boolean;
    files: File[];
    retry: (file: File) => Promise<void>;
  }

  let { cancel, closed = $bindable(), files, retry }: Props = $props();

  let count = $derived(files.length);
  let convertingCount = $derived(files.filter((file) => file.status === 'converting').length);
  let pendingUploadCount = $derived(
    files.filter((file) => ['queued', 'uploading', 'waiting'].includes(file.status)).length,
  );
  let errorCount = $derived(files.filter((file) => file.status === 'error').length);
  let shrink = $state(false);

  function filesLabel(value: number): string {
    return `${value} file${value === 1 ? '' : 's'}`;
  }

  let title = $derived.by(() => {
    if (convertingCount > 0 && pendingUploadCount > 0) return `Processing ${filesLabel(count)}`;
    if (convertingCount > 0) return `Converting ${filesLabel(count)}`;
    if (errorCount > 0 && pendingUploadCount === 0) {
      return `Upload failed for ${filesLabel(errorCount)}`;
    }

    return `Uploading ${filesLabel(count)}`;
  });

  let subtitle = $derived.by(() => {
    if (convertingCount > 0 && pendingUploadCount > 0) {
      return `Uploading ${pendingUploadCount} · converting ${convertingCount}...`;
    }

    if (convertingCount > 0) {
      return `Converting ${filesLabel(convertingCount)}...`;
    }

    if (pendingUploadCount > 0) {
      return `Uploading ${filesLabel(pendingUploadCount)}...`;
    }

    return errorCount > 0 ? 'Some files need your attention.' : 'Finishing...';
  });

  function phaseLabel(file: File): string {
    if (file.status === 'queued') return 'Waiting to upload';
    if (file.status === 'waiting') return 'Waiting to start';
    if (file.status === 'uploading') return 'Uploading';
    if (file.status === 'completed') return 'Complete';
    if (file.status === 'error') return 'Failed';

    switch (file.phase) {
      case 'analyze':
        return 'Analyzing model';
      case 'convert':
        return 'Converting model';
      case 'optimize':
        return 'Optimizing model';
      case 'prepare':
        return 'Preparing files';
      default:
        return 'Preparing conversion';
    }
  }
</script>

<div
  class={[
    'border-sepia-900 bg-sepia-000 fixed right-4 bottom-0 z-50 flex w-full max-w-90 flex-col border-x border-t md:right-6',
    closed ? 'hidden' : 'flex',
    shrink ? 'max-h-14' : 'max-h-80',
  ]}
>
  <div class="flex h-14">
    <div class="w-full py-4 pl-4">
      <p class="truncate">{title}</p>
    </div>

    <div class="flex p-2">
      <button
        class="hover:bg-sepia-200 flex size-10 cursor-pointer items-center justify-center"
        onclick={() => (shrink = !shrink)}
      >
        <span class="sr-only">{shrink ? 'Expand upload queue' : 'Collapse upload queue'}</span>
        <Sprite class="size-5" symbol={shrink ? 'chevron-up' : 'chevron-down'} />
      </button>

      <button
        class="hover:bg-sepia-200 flex size-10 cursor-pointer items-center justify-center"
        onclick={() => (closed = true)}
      >
        <span class="sr-only">Close upload queue</span>
        <Sprite class="size-5" symbol="close" />
      </button>
    </div>
  </div>

  <div
    class="border-alpha-100 bg-sepia-100 flex h-8 shrink-0 items-center gap-3 border-y pr-5 pl-4 text-sm leading-[1.6]"
  >
    <div class="text-sepia-700 w-full">
      <p aria-live="polite" class="truncate">{subtitle}</p>
    </div>

    <button
      class="text-brand-800 cursor-pointer underline-offset-4 hover:underline"
      onclick={() => {
        for (const file of files.slice()) {
          void cancel(file);
        }
      }}
    >
      Cancel
    </button>
  </div>

  <div class="flex h-full max-h-60 flex-col overflow-scroll">
    {#each files as file (file)}
      <div class="flex min-h-13 w-full shrink-0 items-center gap-2.5 py-2 pr-2 pl-5">
        <div
          class={[
            'flex w-full items-center gap-5 overflow-hidden',
            file.status === 'error' && 'text-brick-800',
          ]}
        >
          <Sprite class="size-5 shrink-0" symbol={file.status === 'error' ? 'file-fail' : 'file'} />

          <div class="w-full min-w-0 text-sm leading-[1.6]">
            <div class="truncate">{file.source.name}</div>
            {#if file.errorMessage}
              <div class="line-clamp-2 text-xs leading-[1.4]" role="alert">{file.errorMessage}</div>
            {:else}
              <div class="text-sepia-700 truncate text-xs leading-[1.4]">
                {phaseLabel(file)} · {Math.round(file.progress)}%
              </div>
            {/if}
          </div>
        </div>

        {#if file.status === 'error'}
          <button
            aria-label="Retry {file.source.name}"
            class="hover:bg-sepia-200 flex size-10 shrink-0 cursor-pointer items-center justify-center"
            onclick={() => void retry(file)}
          >
            <Sprite class="size-5" symbol="reset" />
          </button>
        {:else}
          <button
            aria-label="Cancel {file.source.name}"
            class="group hover:before:bg-sepia-300 relative flex size-10 shrink-0 cursor-pointer items-center justify-center before:pointer-events-none before:absolute before:inset-0 before:-z-1 before:rounded-full"
            onclick={() => void cancel(file)}
          >
            <div
              class="bg-sepia-900 text-sepia-000 hidden size-5 items-center justify-center rounded-full group-hover:flex"
            >
              <Sprite class="size-3" symbol="close" />
            </div>

            <ProgressRing
              class="group-hover:hidden"
              label="File progress"
              progress={file.progress}
            />
          </button>
        {/if}
      </div>
    {/each}
  </div>
</div>
