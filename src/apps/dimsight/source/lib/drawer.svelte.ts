import type { Id } from '../mock/convex/_generated/dataModel.ts';

export type ProjectDrawer = ReturnType<typeof createProjectDrawer>;

export function createProjectDrawer() {
  let openProjectId = $state<Id<'projects'> | null>(null);
  let openProjectName = $state<null | string>(null);
  let prefetchProjectId = $state<Id<'projects'> | null>(null);

  return {
    close() {
      openProjectId = null;
      openProjectName = null;
    },
    open(id: Id<'projects'>, name: string) {
      openProjectId = id;
      openProjectName = name;
    },
    prefetch(id: Id<'projects'>) {
      prefetchProjectId = id;
    },
    get projectId() {
      return openProjectId;
    },
    get projectName() {
      return openProjectName;
    },
    get queryProjectId() {
      return openProjectId ?? prefetchProjectId;
    },
  };
}
