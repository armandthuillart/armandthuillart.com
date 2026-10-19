<script lang="ts">
  import Viewer from './components/Viewer.svelte';
  import Sprite from './lib/components/Sprite.svelte';
  import { useQuery } from './lib/convex.svelte.ts';
  import { api } from './mock/convex/_generated/api.ts';

  interface PageProps {
    data: any;
    children?: import('svelte').Snippet;
  }

  let { data }: PageProps = $props();

  let project = $derived(data.project.data);

  let version = useQuery(api.r2.getProjectVersion, () => {
    if (!project || !project.latestVersionId) return 'skip';
    return { versionId: project.latestVersionId };
  });

  let file = $derived.by(() => {
    if (!project || !version.data) return;
    return {
      ...version.data,
      name: project.name,
    };
  });
</script>

<svelte:head>
  <title>{project?.name ?? 'Project'} | Dimsight</title>
</svelte:head>

<!-- todo: that's a lot of error handling, needs to make it deterministic -->
{#if data.project.error}
  <div class="bg-sepia-000 flex h-dvh items-center justify-center p-6 text-center">
    <p class="text-brick-800 max-w-md text-sm leading-[1.6]">
      {data.project.error.message}
    </p>
  </div>
{:else if data.project.isLoading || !project}
  <div class="bg-sepia-000 flex h-dvh items-center justify-center p-6 text-center">
    <p class="text-sepia-700 max-w-md text-sm leading-[1.6]">Loading project…</p>
  </div>
{:else if project.latestVersionId === null}
  <div class="bg-sepia-000 flex h-dvh items-center justify-center p-6 text-center">
    <p class="text-sepia-700 max-w-md text-sm leading-[1.6]">
      This project does not have a revision yet.
    </p>
  </div>
{:else if version.error}
  <div class="bg-sepia-000 flex h-dvh items-center justify-center p-6 text-center">
    <p class="text-brick-800 max-w-md text-sm leading-[1.6]">{version.error.message}</p>
  </div>
{:else if !version.isLoading && version.data === null}
  <div class="bg-sepia-000 flex h-dvh items-center justify-center p-6 text-center">
    <p class="text-brick-800 max-w-md text-sm leading-[1.6]">Revision not found</p>
  </div>
{:else if version.isLoading || !file}
  <div class="flex h-dvh items-center justify-center">
    <Sprite
      class="text-sepia-500 size-10 animate-spin transition-opacity delay-150 duration-0 starting:opacity-0"
      symbol="spinner"
    />
  </div>
{:else}
  <div class="relative h-dvh">
    <Viewer {file} />
  </div>
{/if}
