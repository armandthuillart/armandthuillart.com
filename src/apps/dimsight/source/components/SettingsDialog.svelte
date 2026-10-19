<script lang="ts">
  import { dev, goto, getPage, posthog, mockFetch as fetch } from '../mock/navigation.svelte.ts';
  const page = getPage();
  import { Dialog, Tabs } from 'bits-ui';

  import Sprite from '../lib/components/Sprite.svelte';
  import { useMutation, usePaginatedQuery } from '../lib/convex.svelte.ts';
  import { api } from '../mock/convex/_generated/api.ts';
  import type { Id } from '../mock/convex/_generated/dataModel.ts';
  import { ConvexError } from '../mock/convex/error.ts';
  import type { ServerError } from '../mock/convex/types.ts';

  interface Props {
    open?: boolean;
  }

  let { open = $bindable(false) }: Props = $props();

  const neutralButton =
    'flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1 bg-sepia-200 px-3 text-sm leading-[1.6] hover:bg-sepia-400 disabled:cursor-not-allowed disabled:opacity-40';
  const dangerButton =
    'flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1 bg-brick-800/10 px-3 text-sm leading-[1.6] text-brick-800 hover:bg-brick-800 hover:text-sepia-000 disabled:cursor-not-allowed disabled:opacity-40';

  let tab = $state<'account' | 'data'>('account');
  let confirmingId = $state<Id<'projects'> | null>(null);
  let busyId = $state<Id<'projects'> | null>(null);
  let confirming = $state<'leave' | 'projects' | null>(null);
  let busy = $state(false);
  let error = $state<null | string>(null);

  const archived = usePaginatedQuery(
    api.projects.listArchivedProjects,
    () => (open && tab === 'data' ? {} : 'skip'),
    { initialNumItems: 20 },
  );
  const shared = usePaginatedQuery(
    api.links.listSharedProjects,
    () => (open && tab === 'data' ? {} : 'skip'),
    { initialNumItems: 20 },
  );

  const unarchiveProjectMutation = useMutation(api.projects.unarchiveProject);
  const deleteArchivedProjectMutation = useMutation(api.projects.deleteArchivedProject);
  const deleteAllProjectsMutation = useMutation(api.projects.deleteAllProjects);
  const revokeLinkMutation = useMutation(api.links.revokeLink);
  const deleteAccountMutation = useMutation(api.users.deleteAccount);

  $effect(() => {
    if (open) return;
    confirmingId = null;
    confirming = null;
    error = null;
  });

  $effect(() => {
    void tab;
    confirmingId = null;
    confirming = null;
    error = null;
  });

  function formatDate(timestamp: number) {
    return new Date(timestamp).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  function messageOf(cause: unknown) {
    return cause instanceof ConvexError
      ? (cause.data as ServerError).message
      : 'Something went wrong. Please try again.';
  }

  async function runForProject(projectId: Id<'projects'>, action: () => Promise<unknown>) {
    error = null;
    confirmingId = null;
    busyId = projectId;

    try {
      await action();
    } catch (cause) {
      error = messageOf(cause);
    } finally {
      busyId = null;
    }
  }

  const unarchive = (projectId: Id<'projects'>) =>
    runForProject(projectId, () => unarchiveProjectMutation({ projectId }));

  const deleteArchived = (projectId: Id<'projects'>) =>
    runForProject(projectId, () => deleteArchivedProjectMutation({ projectId }));

  const revoke = (projectId: Id<'projects'>) =>
    runForProject(projectId, () => revokeLinkMutation({ projectId }));

  async function deleteAllProjects() {
    error = null;
    busy = true;

    try {
      await deleteAllProjectsMutation({ deletePhrase: 'delete' });
      confirming = null;
    } catch (cause) {
      error = messageOf(cause);
    } finally {
      busy = false;
    }
  }

  async function leave() {
    error = null;
    busy = true;

    try {
      await deleteAccountMutation({ deletePhrase: 'delete' });
    } catch (cause) {
      error = messageOf(cause);
      busy = false;
      return;
    }

    open = false;
    if (!dev) posthog.reset();

    try {
      await fetch('/auth/logout', { method: 'POST' });
    } catch {}

    await goto('/');
  }
</script>

<Dialog.Root bind:open>
  <Dialog.Portal>
    <Dialog.Overlay class="bg-sepia-900/1 fixed inset-0 z-40 backdrop-blur-xs ease-out" />

    <Dialog.Content
      class="border-sepia-900 bg-sepia-000 fixed inset-0 z-50 flex size-full flex-col border md:top-1/2 md:bottom-[unset] md:left-1/2 md:max-h-175 md:max-w-250 md:-translate-1/2 md:flex-row"
    >
      <Dialog.Title class="sr-only">Settings</Dialog.Title>
      <Dialog.Description class="sr-only">
        Manage your account, shared links and archived projects
      </Dialog.Description>

      <Tabs.Root bind:value={tab} class="contents">
        <div
          class="border-alpha-100 bg-sepia-050 flex w-full shrink-0 flex-col gap-3 border-b p-3 md:h-full md:w-50 md:border-r md:border-b-0"
        >
          <div class="flex items-center justify-between md:hidden">
            <span class="pl-2">Settings</span>

            <Dialog.Close
              class="hover:bg-sepia-200 flex size-9 shrink-0 cursor-pointer items-center justify-center"
            >
              <Sprite class="size-5" symbol="close" />
              <span class="sr-only">Close</span>
            </Dialog.Close>
          </div>

          <div
            class="border-alpha-200 bg-sepia-000 hover:border-sepia-400 mx-auto hidden h-9 w-full cursor-text items-center gap-2 rounded-full border px-3 md:flex"
          >
            <Sprite class="text-sepia-600 size-4 shrink-0" symbol="search" />
            <span class="text-sepia-700">Search</span>
          </div>

          <div class="text-sepia-700 mt-6 hidden pl-2 text-xs md:block">Settings</div>

          <Tabs.List class="flex gap-1 md:flex-col">
            <Tabs.Trigger
              class="shadow-sepia-300 hover:bg-sepia-200 data-[state=active]:border-sepia-400 data-[state=active]:bg-sepia-000 flex h-9 flex-1 cursor-pointer items-center gap-2 border border-transparent px-2 text-sm leading-[1.6] data-[state=active]:shadow-[1px_1px_0_0] md:flex-none"
              value="account"
            >
              <Sprite class="size-4" symbol="user-profile" />
              <span>Account</span>
            </Tabs.Trigger>

            <Tabs.Trigger
              class="shadow-sepia-300 hover:bg-sepia-200 data-[state=active]:border-sepia-400 data-[state=active]:bg-sepia-000 flex h-9 flex-1 cursor-pointer items-center gap-2 border border-transparent px-2 text-sm leading-[1.6] data-[state=active]:shadow-[1px_1px_0_0] md:flex-none"
              value="data"
            >
              <Sprite class="size-4" symbol="folder-down" />
              <span>Data controls</span>
            </Tabs.Trigger>
          </Tabs.List>
        </div>

        <div class="flex min-h-0 flex-1 flex-col">
          <div class="hidden justify-end p-3 md:flex">
            <Dialog.Close
              class="hover:bg-sepia-200 flex size-9 shrink-0 cursor-pointer items-center justify-center"
            >
              <Sprite class="size-5" symbol="close" />
              <span class="sr-only">Close</span>
            </Dialog.Close>
          </div>

          <Tabs.Content class="flex-1 overflow-y-auto px-6 pb-8 md:px-10" value="account">
            <h2 class="text-lg leading-[1.4] tracking-[-0.03em] lg:text-xl">Account</h2>

            <div class="border-sepia-900 mt-5 flex flex-col border">
              <div
                class="border-sepia-900 flex h-12 items-center justify-between gap-4 border-b px-3"
              >
                <span>Name</span>
                <span class="text-sepia-700 line-clamp-1 truncate">
                  {page.data.user?.name ?? 'Anonymous'}
                </span>
              </div>

              <div
                class="border-sepia-900 flex h-12 items-center justify-between gap-4 border-b px-3"
              >
                <span>Email</span>
                <span class="text-sepia-700 line-clamp-1 truncate">{page.data.user?.email}</span>
              </div>

              <div
                class="flex min-h-12 flex-col items-start justify-between gap-3 px-3 py-2 sm:flex-row sm:items-center sm:gap-4"
              >
                <div class="flex flex-col">
                  <span>Leave Dimsight</span>
                  <span class="text-sepia-700 text-sm leading-[1.6]">
                    Removes your account and your access. Your colleagues keep the projects.
                  </span>
                </div>

                {#if confirming === 'leave'}
                  <div class="flex shrink-0 items-center gap-2">
                    <button
                      class={dangerButton}
                      disabled={busy}
                      onclick={() => void leave()}
                      type="button"
                    >
                      {#if busy}
                        <Sprite
                          class="size-4 animate-spin [animation-duration:1s]"
                          symbol="spinner"
                        />
                      {/if}
                      <span>Confirm</span>
                    </button>

                    <button
                      class={neutralButton}
                      disabled={busy}
                      onclick={() => (confirming = null)}
                      type="button"
                    >
                      Cancel
                    </button>
                  </div>
                {:else}
                  <button class={dangerButton} onclick={() => (confirming = 'leave')} type="button">
                    Leave
                  </button>
                {/if}
              </div>
            </div>

            {#if error}
              <p class="text-brick-800 mt-3 text-sm leading-[1.6]">{error}</p>
            {/if}
          </Tabs.Content>

          <Tabs.Content class="flex-1 overflow-y-auto px-6 pb-8 md:px-10" value="data">
            <h2 class="text-lg leading-[1.4] tracking-[-0.03em] lg:text-xl">Data controls</h2>

            {#if error}
              <p class="text-brick-800 mt-3 text-sm leading-[1.6]">{error}</p>
            {/if}

            <h3 class="mt-8 leading-[1.4]">Shared links</h3>
            <p class="text-sepia-700 mt-1 text-sm leading-[1.6]">
              Anyone with a link can open the latest revision of its project. Revoke a link to stop
              sharing.
            </p>
            {@render list(shared, 'No shared links.')}

            <h3 class="mt-10 leading-[1.4]">Archived projects</h3>
            <p class="text-sepia-700 mt-1 text-sm leading-[1.6]">
              Unarchive a project to bring it back, or delete it for good.
            </p>
            {@render list(archived, 'No archived projects.')}

            <div
              class="border-sepia-900 mt-10 flex min-h-12 flex-col items-start justify-between gap-3 border px-3 py-2 sm:flex-row sm:items-center sm:gap-4"
            >
              <div class="flex flex-col">
                <span>Delete all projects</span>
                <span class="text-sepia-700 text-sm leading-[1.6]">
                  Removes every project of your organization, archived or not. This cannot be
                  undone.
                </span>
              </div>

              {#if confirming === 'projects'}
                <div class="flex shrink-0 items-center gap-2">
                  <button
                    class={dangerButton}
                    disabled={busy}
                    onclick={() => void deleteAllProjects()}
                    type="button"
                  >
                    {#if busy}
                      <Sprite
                        class="size-4 animate-spin [animation-duration:1s]"
                        symbol="spinner"
                      />
                    {/if}
                    <span>Confirm</span>
                  </button>

                  <button
                    class={neutralButton}
                    disabled={busy}
                    onclick={() => (confirming = null)}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              {:else}
                <button
                  class={dangerButton}
                  onclick={() => (confirming = 'projects')}
                  type="button"
                >
                  Delete all
                </button>
              {/if}
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

{#snippet list(query: typeof archived | typeof shared, empty: string)}
  {#if query.isLoading}
    <div class="border-sepia-900 mt-5 flex h-12 items-center justify-center border">
      <Sprite class="size-4 animate-spin [animation-duration:1s]" symbol="spinner" />
      <span class="sr-only">Loading</span>
    </div>
  {:else if query.results.length === 0}
    <div class="border-sepia-900 mt-5 flex h-12 items-center border px-3">
      <span class="text-sepia-700">{empty}</span>
    </div>
  {:else}
    <ul class="border-sepia-900 mt-5 flex flex-col border">
      {#each query.results as project (project._id)}
        <li
          class="border-sepia-900 flex min-h-12 items-center justify-between gap-4 px-3 py-2 not-last:border-b"
        >
          <div class="flex min-w-0 flex-col">
            <span class="line-clamp-1 truncate">{project.name}</span>
            <span class="text-sepia-700 line-clamp-1 truncate text-sm leading-[1.6]">
              {#if 'archivedAt' in project}
                Archived {formatDate(project.archivedAt)}
              {:else}
                Shared since {formatDate(project._creationTime)}
              {/if}
            </span>
          </div>

          {#if busyId === project._id}
            <Sprite class="size-4 shrink-0 animate-spin [animation-duration:1s]" symbol="spinner" />
          {:else if 'archivedAt' in project}
            {#if confirmingId === project._id}
              <div class="flex shrink-0 items-center gap-2">
                <button
                  class={dangerButton}
                  onclick={() => void deleteArchived(project._id)}
                  type="button"
                >
                  Confirm
                </button>
                <button class={neutralButton} onclick={() => (confirmingId = null)} type="button">
                  Cancel
                </button>
              </div>
            {:else}
              <div class="flex shrink-0 items-center gap-2">
                <button
                  class={neutralButton}
                  onclick={() => void unarchive(project._id)}
                  type="button"
                >
                  Unarchive
                </button>
                <button
                  class={dangerButton}
                  onclick={() => (confirmingId = project._id)}
                  type="button"
                >
                  Delete
                </button>
              </div>
            {/if}
          {:else}
            <button class={dangerButton} onclick={() => void revoke(project._id)} type="button">
              Revoke
            </button>
          {/if}
        </li>
      {/each}
    </ul>

    {#if query.status === 'CanLoadMore' || query.status === 'LoadingMore'}
      <button
        class="{neutralButton} mx-auto mt-4"
        disabled={query.status === 'LoadingMore'}
        onclick={() => query.loadMore()}
        type="button"
      >
        Load more
      </button>
    {/if}
  {/if}
{/snippet}
