import { api } from '../mock/convex/_generated/api.ts';
import { goto, resolve } from '../mock/navigation.svelte.ts';
import type { FunctionReturnType } from '../mock/types.ts';
import { getProjectDrawer } from './context';
import { useMutation } from './convex.svelte.ts';
import type { Symbol } from './types.ts';

export type MenuItem = {
  label: string;
  symbol: Symbol;
  onclick?: () => void | Promise<void>;
  onhover?: () => void;
};

export type UIProjectVersion = FunctionReturnType<typeof api.r2.getProjectVersion>;

export function createProjectActions(getFile: () => NonNullable<UIProjectVersion>) {
  const archiveProject = useMutation(api.projects.archiveProject);
  const renameProject = useMutation(api.projects.renameProject);
  const revokeLink = useMutation(api.links.revokeLink);
  const getOrCreateLink = useMutation(api.links.getOrCreateLink);
  const drawer = getProjectDrawer();

  const fileName = $state<{ dirty: boolean; input: HTMLInputElement | undefined; value: string }>({
    dirty: false,
    input: undefined,
    value: '',
  });

  function editName() {
    fileName.value = getFile().name;
    fileName.dirty = true;

    queueMicrotask(() => {
      fileName.input?.focus();
      fileName.input?.select();
    });
  }

  async function saveName(event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();

    const file = getFile();
    const name = fileName.value.trim();
    fileName.dirty = false;

    if (!name || name === file.name) {
      fileName.value = file.name;
      return;
    }

    await renameProject(
      {
        name,
        projectId: file.projectId,
      },
      {
        optimisticUpdate: (store) => {
          for (const query of store.getAllQueries(api.r2.listProjectVersions)) {
            if (!query.value) continue;

            store.setQuery(api.r2.listProjectVersions, query.args, {
              ...query.value,
              page: query.value.page.map((candidate) =>
                candidate.projectId === file.projectId
                  ? {
                      ...candidate,
                      name,
                    }
                  : candidate,
              ),
            });
          }

          for (const query of store.getAllQueries(api.projects.listProjects)) {
            if (!query.value) continue;

            store.setQuery(api.projects.listProjects, query.args, {
              ...query.value,
              page: query.value.page.map((candidate) =>
                candidate._id === file.projectId
                  ? {
                      ...candidate,
                      name,
                    }
                  : candidate,
              ),
            });
          }
        },
      },
    );
  }

  const items = $derived.by(() => {
    const file = getFile();

    return [
      {
        label: 'Open in viewer',
        onclick: () => goto(resolve('/(app)/(private)/f/[id]', { id: file.projectId })),
        symbol: 'camera-angle-isometric',
      },
      {
        label: 'Details',
        onclick: () => {
          drawer.open(file.projectId, file.name);
        },
        onhover: () => {
          drawer.prefetch(file.projectId);
        },
        symbol: 'details',
      },
      {
        label: 'Rename',
        onclick: editName,
        symbol: 'text-input',
      },
      {
        label: 'Copy link',
        onclick: async () => {
          const { shareToken } = await getOrCreateLink({ projectId: file.projectId });
          const path = resolve('/(app)/(public)/s/[token]', { token: shareToken });
          await navigator.clipboard.writeText(new URL(path, window.location.origin).href);
        },
        symbol: 'link',
      },
      ...(file.shareToken
        ? [
            {
              label: 'Revoke link',
              onclick: async () => {
                await revokeLink({ projectId: file.projectId });
              },
              symbol: 'link-break',
            } satisfies MenuItem,
          ]
        : []),
      {
        label: 'Archive',
        onclick: async () => {
          await archiveProject(
            { projectId: file.projectId },
            {
              optimisticUpdate: (store) => {
                for (const query of store.getAllQueries(api.r2.listProjectVersions)) {
                  if (!query.value) continue;
                  store.setQuery(api.r2.listProjectVersions, query.args, {
                    ...query.value,
                    page: query.value.page.filter(
                      (candidate) => candidate.projectId !== file.projectId,
                    ),
                  });
                }

                for (const query of store.getAllQueries(api.projects.listProjects)) {
                  if (!query.value) continue;

                  store.setQuery(api.projects.listProjects, query.args, {
                    ...query.value,
                    page: query.value.page.filter((candidate) => candidate._id !== file.projectId),
                  });
                }
              },
            },
          );
        },
        symbol: 'folder-down',
      },
    ] satisfies MenuItem[];
  });

  return {
    editName,
    get fileName() {
      return fileName;
    },
    get items() {
      return items;
    },
    saveName,
  };
}
