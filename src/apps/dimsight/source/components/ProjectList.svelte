<script lang="ts">
  import { goto, getPage } from '../mock/navigation.svelte.ts';
  const page = getPage();
  import { Tabs, Tooltip } from 'bits-ui';
  import { MediaQuery } from 'svelte/reactivity';

  import Sprite from '../lib/components/Sprite.svelte';
  import { getUploader } from '../lib/context.ts';
  import type { QueryResult } from '../lib/convex.svelte.ts';
  import { api } from '../mock/convex/_generated/api.ts';
  import type { SortOrder } from '../mock/convex/types.ts';
  import type { PaginationStatus, FunctionReturnType } from '../mock/types.ts';
  import ProjectCard from './ProjectCard.svelte';

  interface ProjectsQuery {
    readonly results: FunctionReturnType<typeof api.projects.listProjects>['page'][number][];
    readonly status: PaginationStatus;
    loadMore(numItems: number): void;
  }

  interface Props {
    projects: ProjectsQuery;
    sortOrder: SortOrder;
    versions: Record<string, QueryResult<typeof api.r2.getProjectVersion>>;
  }

  let { projects, sortOrder, versions }: Props = $props();

  const PAGE_SIZE = 8;

  const uploader = getUploader();

  const isMidScreen = new MediaQuery('(min-width: 768px) and (max-width: 1919.98px)');

  let target = $state(PAGE_SIZE);
  let revealed = $state(false);
  let urlLayout = $derived<'grid' | 'list'>(
    page.url.searchParams.get('view') === 'list' ? 'list' : 'grid',
  );
  let pendingLayout = $state<'grid' | 'list' | null>(null);
  let layout = $derived(pendingLayout ?? urlLayout);
  let visibleCount = $derived(isMidScreen.current && !revealed ? 6 : target);
  let displayedProjects = $derived(projects.results.slice(0, visibleCount));
  let hasMore = $derived(
    projects.status === 'CanLoadMore' || projects.results.length > visibleCount,
  );
  let loadingMore = $derived(projects.status === 'LoadingMore');

  // The server can return a page with fewer viewable projects than requested (even
  // zero) while more raw rows remain, since it can only skip non-viewable ones within
  // a single page. Keep fetching silently until we catch up to what was asked for or
  // genuinely run out, so "load more" doesn't show up empty-handed.
  $effect(() => {
    if (projects.status === 'CanLoadMore' && projects.results.length < target) {
      projects.loadMore(PAGE_SIZE);
    }
  });

  $effect(() => {
    if (urlLayout === pendingLayout) pendingLayout = null;
  });

  function loadMore() {
    if (isMidScreen.current && !revealed) {
      revealed = true;
      return;
    }
    target += PAGE_SIZE;
  }

  function setLayout(next: typeof layout) {
    if (next === layout) return;
    pendingLayout = next;

    const url = new URL(location.href);

    url.searchParams.set('view', next);
    void goto(`${url.pathname}${url.search}`, { replace: true, reset: false }).finally(() => {
      pendingLayout = null;
    });
  }

  function setOrder(order: SortOrder) {
    if (order === sortOrder) return;

    const url = new URL(location.href);

    url.searchParams.set('order', order);
    void goto(`${url.pathname}${url.search}`, { replace: true, reset: false }).finally(() => {
      pendingLayout = null;
    });
  }
</script>

<div class="flex h-9 justify-between">
  <Tabs.Root
    onValueChange={(value) => setOrder(value as SortOrder)}
    orientation="horizontal"
    value={sortOrder}
  >
    <Tabs.List class="flex gap-6">
      <Tabs.Trigger
        class="text-sepia-700 hover:text-sepia-900 data-[state=active]:border-sepia-900 data-[state=active]:text-sepia-900 flex cursor-pointer border-b border-transparent py-1 text-sm leading-[1.6]"
        value={'desc' satisfies SortOrder}
      >
        Latest
      </Tabs.Trigger>

      <Tabs.Trigger
        class="text-sepia-700 hover:text-sepia-900 data-[state=active]:border-sepia-900 data-[state=active]:text-sepia-900 flex cursor-pointer border-b border-transparent py-1 text-sm leading-[1.6]"
        value={'asc' satisfies SortOrder}
      >
        Oldest
      </Tabs.Trigger>
    </Tabs.List>
  </Tabs.Root>

  <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
    <Tabs.Root
      onValueChange={(value) => setLayout(value as typeof layout)}
      orientation="horizontal"
      value={layout}
    >
      <Tabs.List
        class="group bg-sepia-100 relative flex h-7 w-min overflow-visible"
        data-layout={layout}
      >
        <span
          aria-hidden="true"
          class="border-sepia-300 pointer-events-none absolute inset-0 border"
        ></span>

        <span
          aria-hidden="true"
          class="border-sepia-400 bg-sepia-000 shadow-sepia-300 pointer-events-none absolute inset-0 size-7 border shadow-[1px_1px_0_0] group-focus-within:outline-2 group-focus-within:outline-offset-2 group-data-[layout=grid]:translate-x-0 group-data-[layout=list]:translate-x-1/1"
        ></span>

        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Tabs.Trigger
                {...props}
                class="text-sepia-700 data-[state=active]:text-sepia-900 z-1 flex size-7 cursor-pointer items-center justify-center transition-colors duration-200"
                value="grid"
              >
                <span class="sr-only">Columns</span>
                <Sprite class="size-4" symbol="tiles" />
              </Tabs.Trigger>
            {/snippet}
          </Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Content
              class="bg-sepia-900 text-sepia-000 z-50 grid px-1.5 py-px text-sm leading-[1.6]"
              sideOffset={8}
            >
              Columns
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>

        <Tooltip.Root>
          <Tooltip.Trigger>
            {#snippet child({ props })}
              <Tabs.Trigger
                {...props}
                class="text-sepia-700 data-[state=active]:text-sepia-900 z-1 flex size-7 cursor-pointer items-center justify-center"
                value="list"
              >
                <span class="sr-only">Rows</span>
                <Sprite class="size-4" symbol="list" />
              </Tabs.Trigger>
            {/snippet}
          </Tooltip.Trigger>

          <Tooltip.Portal>
            <Tooltip.Content
              class="border-alpha-100 bg-sepia-900 text-sepia-000 z-50 grid border px-1.5 py-px text-sm leading-[1.6]"
              sideOffset={8}
            >
              Rows
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tabs.List>
    </Tabs.Root>
  </Tooltip.Provider>
</div>

{#if projects.results.length === 0 && uploader.files.length === 0}
  <div
    class="flex flex-col items-center justify-center gap-6 text-center md:[@media(min-height:54rem)]:pt-20"
  >
    <div class="relative size-9">
      <div
        class="border-alpha-200 bg-sepia-000 absolute bottom-px z-0 size-9 origin-bottom-left -translate-x-0.5 scale-84 -rotate-10 border"
      ></div>

      <div
        class="border-alpha-200 bg-sepia-000 absolute z-10 flex size-9 items-center justify-center border"
      >
        <Sprite class="text-sepia-500 size-6" symbol="file" />
      </div>

      <div
        class="border-alpha-200 bg-sepia-000 absolute bottom-px z-0 size-9 origin-bottom-right translate-x-0.5 scale-84 rotate-10 border"
      ></div>
    </div>

    <div class="flex flex-col gap-1">
      <h2 class="text-lg leading-[1.4] tracking-[-0.03em] lg:text-xl">No projects yet</h2>
      <p class="text-sepia-700 text-sm leading-[1.6]">Upload a STEP file to get started.</p>
    </div>
  </div>
{:else if displayedProjects.length > 0}
  {#if layout === 'list'}
    <div class="flex flex-col pb-12">
      {#each displayedProjects as project (project._id)}
        <ProjectCard {layout} preloaded={versions[project.latestVersionId]} {project} />
      {/each}
    </div>
  {:else}
    <div
      class="grid grid-cols-[repeat(auto-fill,minmax(max(var(--min-column-width),calc((100%-3*var(--column-gap))/4)),1fr))] content-start gap-x-(--column-gap) gap-y-5 pb-12 [--column-gap:--spacing(3)] [--min-column-width:--spacing(75)] sm:gap-y-12 sm:[--column-gap:--spacing(4)] md:[--min-column-width:--spacing(90)] xl:[--min-column-width:--spacing(100)]"
    >
      {#each displayedProjects as project (project._id)}
        <ProjectCard {layout} preloaded={versions[project.latestVersionId]} {project} />
      {/each}
    </div>
  {/if}
{/if}

{#if hasMore}
  <button
    class="border-alpha-200 hover:bg-sepia-200 mx-auto inline-flex h-9 w-24 items-center justify-center border px-3 text-sm leading-[1.6] [overflow-anchor:none]"
    onclick={loadMore}
  >
    {#if loadingMore}
      <Sprite class="size-4 animate-spin" symbol="spinner" />
    {:else}
      Load more
    {/if}
  </button>
{/if}
