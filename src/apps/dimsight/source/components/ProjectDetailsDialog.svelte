<script lang="ts">
  import { Accordion, Dialog, Tabs, Tooltip } from 'bits-ui';

  import Sprite from '../lib/components/Sprite.svelte';
  import { getProjectDrawer, getUploader } from '../lib/context.ts';
  import { useMutation, usePaginatedQuery, useQuery } from '../lib/convex.svelte.ts';
  import { api } from '../mock/convex/_generated/api.ts';
  import type { Id } from '../mock/convex/_generated/dataModel.ts';

  const drawer = getProjectDrawer();
  const uploader = getUploader();

  const project = useQuery(api.projects.getProject, () =>
    drawer.queryProjectId ? { projectId: drawer.queryProjectId } : 'skip',
  );
  const versions = useQuery(api.r2.getProjectVersions, () =>
    drawer.queryProjectId ? { projectId: drawer.queryProjectId } : 'skip',
  );

  let tab = $state<'activity' | 'versions'>('versions');
  let dwgInput = $state<HTMLInputElement>();
  let stepInput = $state<HTMLInputElement>();
  let error = $state<null | { title: string; description: string }>(null);
  let draft = $state<string>();
  let confirm = $state(false);
  let editing = $state(false);
  let currentId = $state<Id<'versions'>>();
  let pendingId = $state<Id<'versions'>>();

  let latestId = $derived.by(() => {
    const list = versions.data;
    if (!list || list.length === 0) return;
    for (let i = list.length - 1; i > 0; i--) if (list[i].hasModel) return list[i]._id;
    return list[0]._id;
  });
  let versionId = $derived(
    currentId && versions.data?.some((version: any) => version._id === currentId)
      ? currentId
      : latestId,
  );
  let deletable = $derived(versions.data !== undefined && versions.data[0]?._id !== versionId);

  const activeVersion = useQuery(api.r2.getProjectVersion, () =>
    versionId && versionId !== pendingId ? { versionId } : 'skip',
  );

  const createProjectVersionMutation = useMutation(api.projects.createProjectVersion);
  const deleteProjectVersionMutation = useMutation(api.r2.deleteProjectVersion);
  const removeSourceFileMutation = useMutation(api.r2.removeSourceFile);
  const renameProjectMutation = useMutation(api.projects.renameProject);

  function addFiles(files: File[]) {
    if (!versionId) return;
    uploader.addFiles({ versionId }, files);
  }

  async function createProjectVersion() {
    const projectId = drawer.projectId;
    if (!projectId) return;

    const optimisticId = crypto.randomUUID() as Id<'versions'>;
    pendingId = optimisticId;
    currentId = optimisticId;

    const { versionId } = await createProjectVersionMutation(
      { projectId },
      {
        optimisticUpdate: (store) => {
          const existing = store.getQuery(api.r2.getProjectVersions, { projectId });
          if (existing === undefined) return;

          store.setQuery(api.r2.getProjectVersions, { projectId }, [
            ...existing,
            { _creationTime: Date.now(), _id: optimisticId, dwgFiles: [], hasModel: false },
          ]);
        },
      },
    );

    pendingId = undefined;
    currentId = versionId;
  }

  async function deleteProjectVersion(versionId: Id<'versions'>) {
    const projectId = drawer.projectId;
    if (!projectId) return;

    if (currentId === versionId) currentId = undefined;

    await deleteProjectVersionMutation(
      { versionId },
      {
        optimisticUpdate: (store) => {
          const existing = store.getQuery(api.r2.getProjectVersions, { projectId });
          if (existing === undefined) return;

          store.setQuery(
            api.r2.getProjectVersions,
            { projectId },
            existing.filter((version) => version._id !== versionId),
          );
        },
      },
    );
  }

  async function removeDrawing(targetVersionId: Id<'versions'>, fileId: Id<'files'>) {
    const projectId = drawer.projectId;
    if (!projectId) return;

    await removeSourceFileMutation(
      { fileId },
      {
        optimisticUpdate: (store) => {
          const existing = store.getQuery(api.r2.getProjectVersions, { projectId });
          if (existing === undefined) return;

          store.setQuery(
            api.r2.getProjectVersions,
            { projectId },
            existing.map((version) =>
              version._id === targetVersionId
                ? {
                    ...version,
                    dwgFiles: version.dwgFiles.filter((file: any) => file._id !== fileId),
                  }
                : version,
            ),
          );
        },
      },
    );
  }

  async function renameProject() {
    const projectId = drawer.projectId;
    const name = draft?.trim();
    if (!projectId || !name || name === project.data?.name) return;

    await renameProjectMutation(
      { name, projectId },
      {
        optimisticUpdate: (store) => {
          const existing = store.getQuery(api.projects.getProject, { projectId });
          if (existing)
            store.setQuery(api.projects.getProject, { projectId }, { ...existing, name });

          for (const query of store.getAllQueries(api.projects.listProjects)) {
            if (!query.value) continue;

            store.setQuery(api.projects.listProjects, query.args, {
              ...query.value,
              page: query.value.page.map((candidate) =>
                candidate._id === projectId ? { ...candidate, name } : candidate,
              ),
            });
          }

          for (const query of store.getAllQueries(api.r2.listProjectVersions)) {
            if (!query.value) continue;

            store.setQuery(api.r2.listProjectVersions, query.args, {
              ...query.value,
              page: query.value.page.map((candidate) =>
                candidate.projectId === projectId ? { ...candidate, name } : candidate,
              ),
            });
          }
        },
      },
    );
  }

  function selectFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files].filter((file) => /\.dwg$/i.test(file.name));

    if (list.length === 0) {
      error = {
        description: 'Only DWG files are supported.',
        title: 'Unsupported file',
      };
      return;
    }

    error = null;
    addFiles(list);
  }

  function selectStepFile(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files].filter((file) => /\.(?:step|stp)$/i.test(file.name));

    if (list.length === 0) {
      error = {
        description: 'Only STEP files are supported.',
        title: 'Unsupported file',
      };
      return;
    }

    error = null;
    addFiles(list);
  }

  let preloadActivity = $state(false);

  const activity = usePaginatedQuery(
    api.projects.listProjectActivity,
    () => (preloadActivity && drawer.projectId ? { projectId: drawer.projectId } : 'skip'),
    { initialNumItems: 15 },
  );

  const dayFormat = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

  function actorName(item: (typeof activity.results)[number]) {
    if (item.userName) return item.userName;
    if (item.userEmail) return item.userEmail;
    return item.type === 'share_link_opened' ? 'A recipient' : 'Someone';
  }

  function dayLabel(timestamp: number) {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return dayFormat.format(date);
  }

  let activityGroups = $derived.by(() => {
    const groups: { items: typeof activity.results; label: string }[] = [];

    for (const item of activity.results) {
      const label = dayLabel(item._creationTime);
      const last = groups.at(-1);
      if (last && last.label === label) last.items.push(item);
      else
        groups.push({
          items: [item],
          label,
        });
    }

    return groups;
  });
</script>

<Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
  <Dialog.Root
    onOpenChange={(open) => {
      if (!open) drawer.close();
    }}
    open={drawer.projectId !== null}
  >
    <Dialog.Portal>
      <Dialog.Content
        class="border-sepia-900 bg-sepia-000 fixed inset-y-0 right-0 z-50 flex w-full flex-col border data-[state=closed]:translate-x-full data-[state=open]:translate-x-0 min-[29.6875rem]:max-w-md"
      >
        <Dialog.Title class="sr-only">Versions history</Dialog.Title>
        <Dialog.Description class="sr-only">Manage your project versions</Dialog.Description>

        <div class="border-alpha-200 flex items-center justify-between border-b p-2">
          <div class="group my-2 ml-1 flex h-8 max-w-1/2">
            {#if editing}
              <input
                class="bg-sepia-200 hover:bg-sepia-300 min-w-0 cursor-text px-2 py-1"
                defaultValue={draft}
                name="project-name"
                onblur={() => (editing = false)}
                oninput={(e) => {
                  e.preventDefault();
                  draft = e.currentTarget.value;
                }}
                onkeydown={(e) => {
                  if (e.key === 'Escape') {
                    editing = false;
                    draft = project.data?.name;
                  }
                  if (e.key === 'Enter') {
                    editing = false;
                    void renameProject();
                  }
                }}
                type="text"
                value={draft}
              />

              <button
                class="bg-grass-800 hover:bg-grass-800/80 flex size-8 shrink-0 cursor-pointer items-center justify-center text-white"
                onclick={() => {
                  editing = false;
                  void renameProject();
                }}
                onmousedown={(e) => e.preventDefault()}
              >
                <span class="sr-only">Save</span>
                <Sprite class="size-5" symbol="check" />
              </button>

              <button
                class="bg-brick-800 hover:bg-brick-800/80 flex size-8 shrink-0 cursor-pointer items-center justify-center text-white"
                onclick={() => {
                  editing = false;
                  draft = project.data?.name;
                }}
                onmousedown={(e) => e.preventDefault()}
              >
                <span class="sr-only">Cancel</span>
                <Sprite class="size-5" symbol="close" />
              </button>
            {:else}
              <button
                class="group-hover:bg-sepia-100 hover:bg-sepia-200 min-w-0 cursor-text px-2 py-1"
                onclick={() => {
                  draft = project.data?.name;
                  editing = true;
                }}
              >
                <span class="line-clamp-1 truncate">{project.data?.name}</span>
              </button>

              <button
                class="group-hover:bg-sepia-100 hover:bg-sepia-200 flex size-8 shrink-0 cursor-pointer items-center justify-center"
                onclick={() => {
                  draft = project.data?.name;
                  editing = true;
                }}
              >
                <span class="sr-only">Rename project</span>
                <Sprite class="size-5" symbol="edit-document" />
              </button>
            {/if}
          </div>

          <Dialog.Close
            class="hover:bg-sepia-200 flex size-9 shrink-0 cursor-pointer items-center justify-center"
          >
            <span class="sr-only">Close</span>
            <Sprite class="size-5" symbol="close" />
          </Dialog.Close>
        </div>

        <Accordion.Root
          bind:value={
            () => tab,
            (value) => {
              tab = value ? value : tab === 'versions' ? 'activity' : 'versions';
            }
          }
          class="flex min-h-0 flex-1 flex-col"
          type="single"
        >
          <Accordion.Item
            class="group border-b-alpha-100 border-b data-[state=open]:h-full"
            value="versions"
          >
            <Accordion.Header>
              <Accordion.Trigger
                class="border-alpha-100 flex w-full items-center justify-between p-2 group-data-[state=open]:border-b"
              >
                <div class="ml-3 flex w-full items-center gap-1.5 py-2">
                  <Sprite class="size-5" symbol="version-history" />
                  <span class="line-clamp-1 w-full truncate text-start leading-5 select-none"
                    >Versions</span
                  >
                </div>

                <div
                  class="group hover:bg-sepia-200 flex size-9 shrink-0 cursor-pointer items-center justify-center"
                >
                  <span class="sr-only">Toggle versions</span>
                  <Sprite class="size-5 group-data-[state=open]:hidden" symbol="chevron-down" />
                  <Sprite class="size-5 group-data-[state=closed]:hidden" symbol="chevron-up" />
                </div>
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content class="flex h-full flex-col p-2">
              <Tabs.Root
                class="w-full pt-2 pr-1 pl-3"
                onValueChange={(value) => (versionId = value as Id<'versions'>)}
                value={versionId}
              >
                <div class="flex pb-3.25">
                  <Tabs.List
                    class="group relative -mb-3.25 flex w-min scrollbar-thin overflow-x-scroll pb-3.25"
                  >
                    {#each versions.data ?? [] as version, index (version._id)}
                      <Tabs.Trigger
                        class="border-sepia-400 text-sepia-500 shadow-sepia-300 hover:bg-sepia-200 hover:text-sepia-900 data-[state=active]:bg-sepia-000 data-[state=active]:text-sepia-900 h-7 cursor-pointer px-1.5 font-mono tabular-nums data-[state=active]:border data-[state=active]:shadow-[1px_1px_0_0]"
                        value={version._id}
                      >
                        <span>V{index + 1}</span>
                      </Tabs.Trigger>
                    {/each}
                  </Tabs.List>

                  <button
                    class="bg-sepia-200 hover:bg-sepia-400 flex size-7 shrink-0 cursor-pointer items-center justify-center"
                    onclick={() => void createProjectVersion()}
                    type="button"
                  >
                    <span class="sr-only">New version</span>
                    <Sprite class="size-4" symbol="add" />
                  </button>

                  {#if deletable}
                    {#if confirm}
                      <div
                        class="outline-sepia-900 ml-auto flex h-min shrink-0 items-center outline -outline-offset-1"
                      >
                        <div
                          class="flex h-7 shrink-0 items-center justify-center px-2 font-mono text-sm leading-[1.6] uppercase"
                        >
                          Confirm
                        </div>

                        <button
                          class="bg-grass-800 hover:bg-grass-800/80 flex size-7 shrink-0 cursor-pointer items-center justify-center font-mono text-white tabular-nums"
                          onclick={async () => {
                            confirm = false;
                            if (currentId) await deleteProjectVersion(currentId);
                          }}
                        >
                          <span class="sr-only">Delete</span>
                          <Sprite class="size-4" symbol="check" />
                        </button>

                        <button
                          class="bg-brick-800 text-sepia-000 hover:bg-brick-800/80 flex size-7 shrink-0 cursor-pointer items-center justify-center font-mono tabular-nums"
                          onclick={() => (confirm = false)}
                        >
                          <span class="sr-only">Cancel</span>
                          <Sprite class="size-4" symbol="close" />
                        </button>
                      </div>
                    {:else}
                      <button
                        class="bg-brick-800 text-sepia-000 hover:bg-brick-800/80 ml-auto flex h-7 shrink-0 cursor-pointer items-center justify-center gap-1 px-2 text-sm leading-[1.6]"
                        onclick={() => {
                          currentId = versionId;
                          confirm = true;
                        }}
                        type="button"
                      >
                        <Sprite class="size-4" symbol="trashcan" />
                        <span>Delete</span>
                      </button>
                    {/if}
                  {/if}
                </div>

                {#each versions.data ?? [] as version (version._id)}
                  <Tabs.Content value={version._id}>
                    <div
                      class="mt-3 mb-5 flex items-center gap-1 text-lg leading-[1.4] tracking-[-0.03em] lg:text-xl"
                    >
                      <span>Model</span>
                      <div
                        class="border-brick-800 text-brick-800 relative ml-[0.1em] flex h-5 items-center justify-center rounded-full border bg-transparent px-1.75 py-px align-middle text-[0.8125rem]/6 font-medium tracking-normal uppercase before:absolute"
                      >
                        <span class="-mx-0.5">Required</span>
                      </div>
                    </div>

                    {#if activeVersion.data?.viewUrls?.isometric}
                      <div class="border-sepia-900 mb-10 flex h-14 w-full items-center border">
                        <img
                          alt="Project isometric"
                          class="border-sepia-900 size-14 border-r object-cover"
                          src={activeVersion.data.viewUrls.isometric}
                        />

                        <div class="flex w-full flex-col p-2 text-sm">
                          <span class="line-clamp-1 truncate">{project.data?.name}</span>

                          <span class="text-sepia-700 line-clamp-1 truncate">
                            Uploaded {new Date(version._creationTime).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                    {:else}
                      <div class="border-sepia-900 mb-5 flex h-12 shrink-0 border">
                        <div class="flex w-full items-center p-2 pl-3">
                          <span class="leading-8">No uploaded model yet.</span>
                        </div>

                        <div class="flex items-center justify-center border-l p-2">
                          <button
                            class="bg-brand-800 text-sepia-000 hover:bg-brand-800/80 flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1 pr-2.5 pl-2 text-sm leading-[1.6]"
                            onclick={() => void stepInput?.click()}
                          >
                            <Sprite class="size-4" symbol="download" />
                            <span>STEP</span>
                            <span class="text-sepia-500 font-normal">/</span>
                            <span>STP</span>
                          </button>
                        </div>
                      </div>
                    {/if}

                    <div
                      class="mb-5 flex items-center gap-1 text-lg leading-[1.4] tracking-[-0.03em] lg:text-xl"
                    >
                      <span>Drawings</span>
                      <div
                        class="border-sepia-900 text-sepia-900 relative ml-[0.1em] flex h-5 items-center justify-center rounded-full border bg-transparent px-1.75 py-px align-middle text-[0.8125rem]/6 font-medium tracking-normal uppercase before:absolute"
                      >
                        <span class="-mx-0.5">Optional</span>
                      </div>
                    </div>

                    {#if version.dwgFiles.length === 0}
                      <div class="border-sepia-900 flex h-12 shrink-0 border">
                        <div class="flex w-full items-center p-2 pl-3">
                          <span class="leading-8">No uploaded drawings yet.</span>
                        </div>

                        <div class="flex items-center justify-center border-l p-2">
                          <button
                            class="bg-brand-800 text-sepia-000 hover:bg-brand-800/80 flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1 pr-2.5 pl-2 text-sm leading-[1.6]"
                            onclick={() => void dwgInput?.click()}
                          >
                            <Sprite class="size-4" symbol="download" />
                            <span>DWG</span>
                          </button>
                        </div>
                      </div>
                    {:else}
                      <div class="border-sepia-900 mb-4 flex flex-col border">
                        {#each version.dwgFiles as dwgFile (dwgFile._id)}
                          <div
                            class="border-sepia-900 flex h-9 items-center overflow-hidden not-last:border-b"
                          >
                            <div class="border-sepia-900 w-full min-w-0 border-r p-2">
                              <span class="line-clamp-1 truncate">{dwgFile.name}</span>
                            </div>

                            <div class="flex shrink-0">
                              <button
                                class="text-brick-800 hover:bg-brick-800 flex size-9 shrink-0 cursor-pointer items-center justify-center hover:text-white"
                                onclick={() => void removeDrawing(version._id, dwgFile._id)}
                              >
                                <span class="sr-only">Remove {dwgFile.name}</span>
                                <Sprite class="size-5" symbol="trashcan" />
                              </button>
                            </div>
                          </div>
                        {/each}
                      </div>

                      <button
                        class="bg-brand-800 text-sepia-000 hover:bg-brand-800/80 mx-auto flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1 pr-2.5 pl-2 text-sm leading-[1.6]"
                        onclick={() => void dwgInput?.click()}
                      >
                        <Sprite class="size-4" symbol="download" />
                        <span>DWG</span>
                      </button>
                    {/if}

                    <input
                      accept=".dwg"
                      aria-label="Upload DWG files"
                      bind:this={dwgInput}
                      class="sr-only"
                      multiple
                      onchange={(event) => {
                        selectFiles(event.currentTarget.files);
                        event.currentTarget.value = '';
                      }}
                      type="file"
                    />

                    <input
                      accept=".step,.stp"
                      aria-label="Upload STEP files"
                      bind:this={stepInput}
                      class="sr-only"
                      onchange={(event) => {
                        selectStepFile(event.currentTarget.files);
                        event.currentTarget.value = '';
                      }}
                      type="file"
                    />

                    {#if error}
                      <p class="text-brick-800">{error.description}</p>
                    {/if}
                  </Tabs.Content>
                {/each}
              </Tabs.Root>
            </Accordion.Content>
          </Accordion.Item>

          <Accordion.Item
            class="group flex min-h-0 flex-col data-[state=open]:flex-1"
            value="activity"
          >
            <Accordion.Header>
              <Accordion.Trigger
                class="border-alpha-100 flex w-full items-center justify-between p-2 group-data-[state=open]:border-b"
                onfocus={() => (preloadActivity = true)}
                onmouseenter={() => (preloadActivity = true)}
              >
                <div class="ml-3 flex w-full items-center gap-1.5 py-2">
                  <Sprite class="size-5" symbol="history" />
                  <span class="line-clamp-1 w-full truncate text-start leading-5">Activity</span>
                </div>

                <div
                  class="group hover:bg-sepia-200 flex size-9 shrink-0 cursor-pointer items-center justify-center"
                >
                  <span class="sr-only">Toggle activity</span>
                  <Sprite class="size-5 group-data-[state=open]:hidden" symbol="chevron-down" />
                  <Sprite class="size-5 group-data-[state=closed]:hidden" symbol="chevron-up" />
                </div>
              </Accordion.Trigger>
            </Accordion.Header>

            <Accordion.Content class="min-h-0 flex-1 overflow-y-auto p-2">
              <div class="w-full pt-2 pr-1 pb-2 pl-3">
                {#if activity.results.length === 0}
                  {#if activity.isLoading || activity.status === 'LoadingFirstPage'}
                    <div class="flex h-12 items-center justify-center">
                      <Sprite class="text-sepia-700 size-5 animate-spin" symbol="spinner" />
                    </div>
                  {:else}
                    <div class="border-sepia-900 flex h-12 shrink-0 border">
                      <div class="flex w-full items-center p-2 pl-3">
                        <span class="leading-8">No activity yet.</span>
                      </div>
                    </div>
                  {/if}
                {:else}
                  {#each activityGroups as group (group.label)}
                    <div
                      class="mt-3 mb-5 flex items-center gap-1 text-lg leading-[1.4] tracking-[-0.03em] lg:text-xl"
                    >
                      <span>{group.label}</span>
                    </div>

                    <ol class="mb-5 ml-1 flex flex-col">
                      {#each group.items as item, index (item._id)}
                        <li class="relative pb-5 pl-4 text-sm last:pb-0">
                          {#if group.items.length > 1}
                            <span
                              class={[
                                'bg-brand-800 absolute left-0 w-px',
                                index === 0
                                  ? 'top-2.75 bottom-0'
                                  : index === group.items.length - 1
                                    ? 'top-0 h-2.75'
                                    : 'inset-y-0',
                              ]}
                            ></span>
                          {/if}

                          <span
                            class={[
                              'absolute top-1.75 -left-1 size-2.25',
                              item.type === 'project_created' ? 'bg-sepia-900' : 'bg-brand-800',
                            ]}
                          ></span>

                          <p class="leading-[1.6] wrap-break-word">
                            {actorName(item)}
                            <span class="text-sepia-700">{item.summary}</span>
                          </p>

                          <time
                            class="text-sepia-700 font-mono tabular-nums"
                            datetime={new Date(item._creationTime).toISOString()}
                          >
                            {timeFormat.format(item._creationTime)}
                          </time>
                        </li>
                      {/each}
                    </ol>
                  {/each}

                  {#if activity.status === 'CanLoadMore'}
                    <button
                      class="bg-brand-800 text-sepia-000 hover:bg-brand-800/80 mx-auto flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1 px-2.5 text-sm leading-[1.6]"
                      onclick={() => activity.loadMore(15)}
                      type="button"
                    >
                      <span>Load more</span>
                    </button>
                  {/if}
                {/if}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        </Accordion.Root>

        <!-- {#if versions.isLoading}
        <div class="flex flex-1 items-center justify-center">
          <Sprite class="size-8 animate-spin text-sepia-700" symbol="spinner" />
        </div>
      {:else if project.error}
        <div class="flex flex-1 items-center justify-center">
          {@render emptyState(
            'file-fail',
            'This project is unavailable',
            'It may have been archived.',
            'error',
          )}
        </div>
      {:else}
        <Tabs.Root
          class="flex min-h-0 flex-1 flex-col"
          onValueChange={(value) => (selectedVersionId = value as Id<'versions'>)}
          value={activeVersionId}
        >
          <Tabs.List class="flex shrink-0 items-center gap-1 overflow-x-auto pr-2 pl-5">
            {#each versions.data ?? [] as version, i (version._id)}
              <Tabs.Trigger
                class="flex h-14 shrink-0 items-center border-b-2 border-transparent px-2 text-sm leading-[1.6] text-sepia-700 hover:text-sepia-900 data-[state=active]:border-sepia-900 data-[state=active]:text-sepia-900"
                value={version._id}
              >
                V{i + 1}
              </Tabs.Trigger>
            {/each}

            <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
              <Tooltip.Root>
                <Tooltip.Trigger>
                  {#snippet child({ props })}
                    <button
                      {...props}
                      aria-label="New revision"
                      class="ml-auto flex size-9 shrink-0 cursor-pointer items-center justify-center text-sepia-700 hover:bg-sepia-200"
                      onclick={() => void addVersion()}
                    >
                      <Sprite class="size-5" symbol="add" />
                    </button>
                  {/snippet}
                </Tooltip.Trigger>

                <Tooltip.Portal>
                  <Tooltip.Content
                    class="z-50 grid border border-alpha-100 bg-sepia-900 px-1.5 py-px text-sm leading-[1.6] text-sepia-000 shadow-[0_12px_80px] shadow-black/16"
                    sideOffset={8}
                  >
                    New revision
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          </Tabs.List>

          {#each versions.data ?? [] as version (version._id)}
            <Tabs.Content
              class="flex min-h-0 flex-1 flex-col border-t border-alpha-200"
              value={version._id}
            >
              <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
                {#if version.dwgFiles.length === 0}
                  {@render emptyState(
                    'file',
                    'No DWG files yet',
                    'Drag technical drawings into the dropzone below.',
                  )}
                {:else}
                  {#each version.dwgFiles as dwgFile (dwgFile._id)}
                    <div
                      class="group flex min-h-14 items-center gap-3 border-b border-alpha-100 px-5 py-3"
                    >
                      <Sprite class="size-5 shrink-0 text-sepia-600" symbol="file" />

                      <div class="min-w-0 flex-1 text-sm leading-[1.6]">
                        <div class="truncate">{dwgFile.name}</div>
                        <div class="text-xs leading-[1.4] text-sepia-700">
                          {formatSize(dwgFile.size)}
                        </div>
                      </div>

                      <button
                        aria-label="Remove {dwgFile.name}"
                        class="flex size-10 shrink-0 cursor-pointer items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-sepia-200 focus-visible:opacity-100"
                        onclick={() => void removeFile(dwgFile._id)}
                      >
                        <Sprite class="size-5" symbol="close" />
                      </button>
                    </div>
                  {/each}
                {/if}

                <div class="flex flex-col gap-2 p-5">
                  <input
                    aria-label="Upload DWG files"
                    accept=".dwg"
                    bind:this={input}
                    class="sr-only"
                    multiple
                    onchange={(event) => {
                      select(event.currentTarget.files);
                      event.currentTarget.value = '';
                    }}
                    type="file"
                  />

                  <div
                    class={[
                      'group relative flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 border',
                      error
                        ? 'border-brick-800/50 bg-brick-800/5 hover:bg-brick-800/10 data-dragging:border-brick-800/70 data-dragging:bg-brick-800/10'
                        : 'border-alpha-200 bg-sepia-100 hover:bg-sepia-200 data-dragging:border-alpha-200 data-dragging:bg-sepia-200',
                    ]}
                    data-dragging={dragging || undefined}
                    onclick={() => input?.click()}
                    ondragenter={(event) => {
                      event.preventDefault();
                      dragging = true;
                    }}
                    ondragleave={(event) => {
                      if (!event.currentTarget.contains(event.relatedTarget as Node | null))
                        dragging = false;
                    }}
                    ondragover={(event) => event.preventDefault()}
                    ondrop={(event) => {
                      event.preventDefault();
                      dragging = false;
                      select(event.dataTransfer?.files ?? null);
                    }}
                    onkeydown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        input?.click();
                      }
                    }}
                    role="button"
                    tabindex="0"
                  >
                    <Sprite
                      class={['size-8', error ? 'text-brick-800' : 'text-sepia-600']}
                      symbol="download"
                    />

                    <div class="flex flex-col gap-0.5 text-center text-sm leading-[1.6]">
                      {#if error}
                        <p class="text-brick-800">{error}</p>
                      {:else}
                        <p>Drag and drop DWG files here</p>
                        <p class="text-sepia-700">Attaches to this revision.</p>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>

              <div
                class={[
                  'flex shrink-0 flex-col overflow-hidden',
                  activityExpanded ? 'max-h-80' : 'max-h-14',
                ]}
              >
                <div
                  class="flex h-14 shrink-0 items-center justify-between border-y border-alpha-100 bg-sepia-100 pl-5"
                >
                  <p class="text-sm leading-[1.6] text-sepia-700">
                    Activity{#if activity.results.length > 0}
                      · {activity.results.length}
                    {/if}
                  </p>

                  <div class="flex p-2">
                    <button
                      aria-label={activityExpanded ? 'Collapse activity' : 'Expand activity'}
                      class="flex size-10 shrink-0 cursor-pointer items-center justify-center hover:bg-sepia-200"
                      onclick={() => {
                        activityRequested = true;
                        activityExpanded = !activityExpanded;
                      }}
                      onmouseenter={() => (activityRequested = true)}
                    >
                      <Sprite
                        class="size-5"
                        symbol={activityExpanded ? 'chevron-up' : 'chevron-down'}
                      />
                    </button>
                  </div>
                </div>

                <div class="flex flex-col overflow-y-auto">
                  {#if activity.results.length === 0 && activity.status !== 'LoadingFirstPage'}
                    {@render emptyState(
                      'stopwatch-filled',
                      'No activity yet',
                      'Changes will show up here.',
                    )}
                  {:else}
                    {#each activity.results as item (item._id)}
                      <div
                        class="flex min-h-14 items-start gap-3 border-b border-alpha-100 px-5 py-3"
                      >
                        <Sprite
                          class="mt-0.5 size-4 shrink-0 text-sepia-600"
                          symbol={activityIcon(item.type)}
                        />

                        <div class="flex min-w-0 flex-col text-sm leading-[1.6]">
                          <p class="truncate">
                            <span class="text-sepia-900"
                              >{item.userName ?? item.userEmail ?? 'A recipient'}</span
                            >
                            {item.summary}
                          </p>
                          <p class="text-xs leading-[1.4] text-sepia-700">
                            {new Date(item._creationTime).toLocaleDateString('en-US', {
                              day: 'numeric',
                              year: 'numeric',
                              month: 'short',
                            })}
                          </p>
                        </div>
                      </div>
                    {/each}

                    {#if activity.status === 'CanLoadMore'}
                      <button
                        class="mx-auto my-4 inline-flex h-9 w-24 items-center justify-center border border-alpha-200 px-3 text-sm leading-[1.6] hover:bg-sepia-200"
                        onclick={() => activity.loadMore(ACTIVITY_PAGE_SIZE)}
                      >
                        Load more
                      </button>
                    {/if}
                  {/if}
                </div>
              </div>
            </Tabs.Content>
          {/each}
        </Tabs.Root>
      {/if} -->
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>
</Tooltip.Provider>
