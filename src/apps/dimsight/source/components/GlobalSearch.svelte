<script lang="ts">
  import { Command, Dialog } from 'bits-ui';
  import { MediaQuery } from 'svelte/reactivity';

  import Sprite from '../lib/components/Sprite.svelte';
  import { useQuery } from '../lib/convex.svelte.ts';
  import type { Symbol } from '../lib/types.ts';
  import { api } from '../mock/convex/_generated/api.ts';
  import { goto, resolve } from '../mock/navigation.svelte.ts';
  import ViewImageCarousel from './ViewImageCarousel.svelte';

  let { open = $bindable(false) } = $props();

  let mobile = new MediaQuery('max-width: 768px');

  let searchQuery = $state('');
  let selectedValue = $state('');
  let debouncedSearchQuery = $state('');

  let placeholder = $derived(mobile.current ? 'Search...' : 'Search for files...');
  let trimmedSearchQuery = $derived(searchQuery.trim());
  let hasSearchQuery = $derived(trimmedSearchQuery.length > 0);
  let selectedFile = $derived.by(
    () =>
      paginatedData.find((project: any) => `model-${project._id}` === selectedValue) ??
      paginatedData[0],
  );

  $effect(() => {
    const querySnapshot = trimmedSearchQuery;

    const timeout = setTimeout(() => {
      debouncedSearchQuery = querySnapshot;
    }, 200);

    return () => clearTimeout(timeout);
  });

  let searchResults = useQuery(api.r2.searchProjectVersions, () =>
    debouncedSearchQuery.length > 0 ? { query: debouncedSearchQuery } : 'skip',
  );
  let paginatedData = $derived(
    (searchResults.data ?? []).filter((project: any) => project.viewUrls !== undefined),
  );
</script>

{#snippet emptyState(symbol: Symbol, title: string, description: string, variant?: 'error')}
  <div class="flex w-full flex-col items-center justify-center gap-6 text-center">
    <div class="relative size-9">
      <div
        class="bg-sepia-100 absolute bottom-px z-0 size-9 origin-bottom-left -translate-x-0.5 scale-84 -rotate-10 shadow-border"
      ></div>

      <div class="bg-sepia-000 absolute z-10 flex size-9 items-center justify-center shadow-border">
        <Sprite
          class={['size-6', variant === 'error' ? 'text-brick-800' : 'text-sepia-500']}
          {symbol}
        />
      </div>

      <div
        class="bg-sepia-100 absolute bottom-px z-0 size-9 origin-bottom-right translate-x-0.5 scale-84 rotate-10 shadow-border"
      ></div>
    </div>

    <div class={['flex flex-col gap-1', variant === 'error' && 'text-brick-800']}>
      <h2 class="text-lg leading-[1.4] tracking-[-0.03em] lg:text-xl">
        {title}
      </h2>

      <p class={['text-sm leading-[1.6]', variant !== 'error' && 'text-sepia-700']}>
        {description}
      </p>
    </div>
  </div>
{/snippet}

<Dialog.Root bind:open>
  <Dialog.Trigger
    class="border-alpha-200 hover:bg-sepia-100 mx-auto flex h-9 w-full max-w-lg cursor-text items-center gap-2 rounded-full border px-4 md:gap-3"
  >
    <Sprite class="text-sepia-600 size-4 shrink-0" symbol="search" />
    <span class="text-sepia-700">{placeholder}</span>
  </Dialog.Trigger>

  <Dialog.Portal>
    <Dialog.Content
      class="fixed inset-0 z-50 flex size-full items-center md:top-1/2 md:bottom-[unset] md:left-1/2 md:max-h-175 md:max-w-250 md:-translate-1/2"
    >
      <Dialog.Title class="sr-only">Global Search</Dialog.Title>
      <Dialog.Description class="sr-only">Use the arrow keys to navigate.</Dialog.Description>

      <Command.Root
        bind:value={selectedValue}
        class="bg-sepia-000 before:border-sepia-900 relative flex size-full flex-col overflow-hidden outline-none before:pointer-events-none before:absolute before:inset-0 before:border before:content-[''] md:max-h-175"
      >
        <div class="border-alpha-200 flex border-b">
          <Command.Input
            autofocus
            bind:value={searchQuery}
            class="w-full bg-background px-3 py-2 caret-accent placeholder:text-muted-foreground focus-visible:outline-none md:p-0 md:px-6 md:py-5"
            {placeholder}
          />

          <button
            class="md:hover:bg-sepia-200 m-3 shrink-0 cursor-pointer active:opacity-50 md:flex md:size-10 md:items-center md:justify-center"
            onclick={() => (open = false)}
          >
            <span class="md:sr-only">Cancel</span>
            <Sprite class="hidden size-5 md:block" symbol="close" />
          </button>
        </div>

        <Command.List class="size-full overflow-x-hidden overflow-y-auto">
          <Command.Viewport class="flex h-full flex-col">
            <div class="flex size-full p-3 md:p-6">
              {#if hasSearchQuery}
                {#if debouncedSearchQuery !== trimmedSearchQuery || searchResults.isLoading}
                  <div class="flex w-full items-center justify-center">
                    <Sprite class="text-sepia-500 size-10 animate-spin" symbol="spinner" />
                  </div>
                {:else if searchResults.error}
                  {@render emptyState(
                    'file-fail',
                    'Something went wrong',
                    searchResults.error.message,
                    'error',
                  )}
                {:else if paginatedData.length === 0}
                  {@render emptyState(
                    'search',
                    'No results found',
                    'Are you sure it is spelled correctly?',
                  )}
                {:else}
                  <div class="order-1 w-full">
                    {#each paginatedData as project (project._id)}
                      <Command.Item
                        class="group data-selected:bg-brand-800 data-selected:text-sepia-000 flex h-10 items-center gap-2 px-3"
                        keywords={[project.name]}
                        onSelect={async () =>
                          await goto(resolve('/(app)/(private)/f/[id]', { id: project.projectId }))}
                        value={`model-${project._id}`}
                      >
                        <Sprite
                          class="not-group-data-selected:text-sepia-700 size-5"
                          symbol="file"
                        />
                        <div class="line-clamp-1 flex-1 truncate text-sm leading-[1.6]">
                          {project.name}
                        </div>
                      </Command.Item>
                    {/each}
                  </div>

                  {#if selectedFile}
                    <div
                      class="group bg-sepia-200 relative order-2 ml-6 hidden h-full w-1/2 shrink-0 md:flex"
                    >
                      <a
                        class="absolute top-1/2 left-1/2 z-2 size-1/3 -translate-1/2 pointer-coarse:hidden"
                        href={resolve('/(app)/(private)/f/[id]', { id: selectedFile.projectId })}
                      >
                        <span class="sr-only">Open viewer</span>
                      </a>

                      <ViewImageCarousel
                        fileName={selectedFile.name}
                        viewUrls={selectedFile.viewUrls}
                      />
                    </div>
                  {/if}
                {/if}
              {:else}
                {@render emptyState(
                  'search',
                  'Start typing to search',
                  'Files will appear here as you type.',
                )}
              {/if}
            </div>

            <div class="border-alpha-200 flex items-center justify-between border-t px-6 py-5">
              <div class="text-xs">
                <span>Looking for something else?</span>
                <a
                  class="text-accent underline-offset-3 hover:underline"
                  href="mailto:feedback@dimsight.com"
                >
                  Send feedback
                </a>
              </div>

              <div class="text-sepia-700 flex items-center gap-1.5 pointer-coarse:hidden">
                <Sprite class="size-5" symbol="keyboard" />

                <p class="text-sm leading-[1.6]">
                  Press <kbd class="bg-sepia-200 px-1 py-px font-mono text-xs">Enter</kbd> to open viewer
                </p>
              </div>
            </div>
          </Command.Viewport>
        </Command.List>
      </Command.Root>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
