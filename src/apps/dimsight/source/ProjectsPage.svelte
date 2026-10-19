<script lang="ts">
  import { MediaQuery } from 'svelte/reactivity';

  import DropZone from './components/DropZone.svelte';
  import GlobalSearch from './components/GlobalSearch.svelte';
  import ProfileSetupDialog from './components/ProfileSetupDialog.svelte';
  import ProgressRing from './components/ProgressRing.svelte';
  import ProjectDetailsDialog from './components/ProjectDetailsDialog.svelte';
  import ProjectList from './components/ProjectList.svelte';
  import UploadQueue from './components/UploadQueue.svelte';
  import UserMenu from './components/UserMenu.svelte';
  import Sprite from './lib/components/Sprite.svelte';
  import { setProjectDrawer, setUploader } from './lib/context.ts';
  import { useMutation } from './lib/convex.svelte.ts';
  import { createProjectDrawer } from './lib/drawer.svelte.ts';
  import { createUploader } from './lib/upload.svelte.ts';
  import { api } from './mock/convex/_generated/api.ts';
  import { resolve } from './mock/navigation.svelte.ts';

  interface PageProps {
    data: any;
    children?: import('svelte').Snippet;
  }

  let { data }: PageProps = $props();

  let mobile = new MediaQuery('(max-width: 768px)');

  let isQueueClosed = $state(false);
  let isSearchOpen = $state(false);
  let scrollY = $state(0);

  const uploader = createUploader(() => data.organization.entitlements.enabled);
  setUploader(uploader);

  setProjectDrawer(createProjectDrawer());
  const createProjectWithVersion = useMutation(api.projects.createProjectWithVersion);

  let progress = $derived(
    uploader.files.length === 0
      ? 0
      : Math.round(
          uploader.files.reduce((total, file) => total + file.progress, 0) / uploader.files.length,
        ),
  );

  async function addFiles(files: File[]) {
    const first = files[0];
    if (!first) return;

    const name = first.name.replace(/\.(?:step|stp|dwg)$/i, '').trim() || 'Untitled project';
    const { versionId } = await createProjectWithVersion({
      fileNames: files.map((file) => file.name),
      name,
    });
    uploader.addFiles({ versionId }, files);
  }
</script>

<svelte:head>
  <title>Dimsight</title>
</svelte:head>

<svelte:window bind:scrollY />

{#if !data.user.name}
  <ProfileSetupDialog />
{/if}

<header class="sticky top-0 z-50">
  <nav
    class={[
      'bg-sepia-000 border-b p-4 px-5 transition-colors duration-100 ease-linear md:px-6 xl:px-8 2xl:px-20',
      scrollY > 0 ? 'border-alpha-100' : 'border-transparent',
    ]}
  >
    <div
      class="mx-auto grid w-full max-w-480 grid-cols-[min-content_auto_min-content] grid-rows-[1fr_auto] items-center gap-x-5 md:grid-cols-3 md:grid-rows-1 md:justify-between"
    >
      <a
        aria-label="Go to home"
        class="text-brand-800 hover:text-sepia-800 w-min"
        href={resolve('/(app)/(private)')}
      >
        <Sprite
          class="h-5"
          symbol={`dimsight-${mobile.current ? 'mark' : 'logo'}`}
          viewBox={mobile.current ? '0 0 16 16' : '0 0 80 16'}
        />
      </a>

      <GlobalSearch bind:open={isSearchOpen} />

      <div class="ml-auto flex gap-2">
        {#if uploader.files.length > 0 && isQueueClosed}
          <button
            aria-label="See upload progress"
            class="border-alpha-200 bg-sepia-000 text-sepia-700 hover:bg-sepia-100 flex size-8 cursor-pointer items-center justify-center border"
            onclick={() => (isQueueClosed = false)}
          >
            <ProgressRing label="Overall progress" {progress} symbol="download" />
          </button>
        {/if}

        <UserMenu />
      </div>
    </div>
  </nav>
</header>

<main class="px-5 pt-8 pb-12 md:px-6 xl:px-8 2xl:px-20">
  <div class="mx-auto flex max-w-480 flex-col gap-8 md:gap-16">
    <div class="flex-col gap-6">
      {#if !data.organization.entitlements.enabled}
        <div
          class="border-brick-800/50 bg-brick-800/5 text-brick-800 flex h-12 w-full items-center justify-center border"
        >
          <p>
            Your organization access has been revoked. If you think this is a mistake, please
            contact your administrator.
          </p>
        </div>
      {/if}

      <DropZone {addFiles} />
    </div>

    <ProjectList projects={data.projects} sortOrder={data.sortOrder} versions={data.versions} />
  </div>

  {#if uploader.files.length > 0}
    <UploadQueue
      bind:closed={isQueueClosed}
      cancel={uploader.cancel}
      files={uploader.files}
      retry={uploader.retry}
    />
  {/if}
</main>

<ProjectDetailsDialog />
