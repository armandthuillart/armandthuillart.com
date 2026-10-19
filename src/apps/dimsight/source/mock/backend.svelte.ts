import { createContext, onMount } from 'svelte';

import { initialDimsightProjects } from '../../data';
const fixtureRoot = '/apps/dimsight/assets';
const fixture = {
  drawings: [1, 2, 3].map((i) => ({
    fileId: `drawing-${i}`,
    name: `Drawing ${i}.svg`,
    url: `${fixtureRoot}/drawings/source-${i}.svg`,
  })),
  glbUrl: `${fixtureRoot}/viewer.glb`,
  manifestUrl: `${fixtureRoot}/manifest.json`,
  viewUrls: Object.fromEntries(
    ['isometric', 'front', 'back', 'left', 'right', 'top', 'bottom'].map((view) => [
      view,
      `${fixtureRoot}/views/${view}.webp`,
    ]),
  ),
};
export function createBackend() {
  const projects = $state<any[]>(
    initialDimsightProjects.map((p) => ({
      _creationTime: Date.parse(p.uploadedAt),
      _id: p.id,
      archived: false,
      latestVersionId: `${p.id}-${p.versions.at(-1)!.id}`,
      name: p.name,
      shareToken: p.shared ? `demo-${p.id}` : undefined,
    })),
  );
  const versions = $state<any[]>(
    initialDimsightProjects.flatMap((p) =>
      p.versions.map((v) => ({
        _creationTime: Date.parse(p.uploadedAt),
        _id: `${p.id}-${v.id}`,
        dwgFiles: fixture.drawings.map((d) => ({
          _id: `${p.id}-${v.id}-${d.fileId}`,
          name: d.name,
          url: d.url,
        })),
        hasModel: true,
        projectId: p.id,
      })),
    ),
  );
  const activity = $state<any[]>(
    projects.map((p) => ({
      _creationTime: p._creationTime,
      _id: `created-${p._id}`,
      projectId: p._id,
      summary: 'created this project',
      type: 'project_created',
      userName: 'Armand',
    })),
  );
  const page = $state({
    data: {
      user: { name: 'Armand', email: 'armand@example.com' },
      organization: { entitlements: { enabled: true } },
    },
    url: new URL('https://playable.local/?view=grid&order=desc'),
  });
  let restored = $state(false);
  onMount(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('dimsight-playable-v2') ?? 'null');
      if (
        saved &&
        Array.isArray(saved.projects) &&
        Array.isArray(saved.versions) &&
        Array.isArray(saved.activity)
      ) {
        projects.splice(0, projects.length, ...saved.projects);
        versions.splice(0, versions.length, ...saved.versions);
        activity.splice(0, activity.length, ...saved.activity);
        if (typeof saved.name === 'string') page.data.user.name = saved.name;
      }
    } catch {
      /* Storage may be unavailable in private browsing. */
    }
    restored = true;
  });
  $effect(() => {
    if (!restored) return;
    const saved = JSON.stringify({
      activity,
      name: page.data.user.name,
      projects,
      versions,
    });
    try {
      localStorage.setItem('dimsight-playable-v2', saved);
    } catch {}
  });
  function versionData(v: any): any {
    if (!v) return null;
    const p = projects.find((p) => p._id === v.projectId);
    return {
      ...v,
      ...fixture,
      name: p?.name ?? 'Project',
      shareToken: p?.shareToken,
      ...(v.hasModel
        ? {}
        : {
            glbUrl: undefined,
            manifestUrl: undefined,
            viewUrls: undefined,
          }),
      drawings: v.dwgFiles.map((d: any) => ({
        fileId: d._id,
        name: d.name,
        url: d.url,
      })),
    };
  }
  function query(fn: string, args: any = {}): any {
    if (args === 'skip') return undefined;
    const active = projects.filter((p) => !p.archived);
    switch (fn) {
      case 'links.listSharedProjects':
        return active.filter((p) => p.shareToken).map((p) => ({ ...p, projectId: p._id }));
      case 'projects.getProject':
        return projects.find((p) => p._id === args.projectId) ?? null;
      case 'projects.listArchivedProjects':
        return projects.filter((p) => p.archived);
      case 'projects.listProjectActivity':
        return activity.filter((a) => a.projectId === args.projectId).toReversed();
      case 'projects.listProjects':
        return [...active].sort(
          (a, b) => (args.order === 'asc' ? 1 : -1) * (a._creationTime - b._creationTime),
        );
      case 'r2.getProjectVersion':
        return versionData(versions.find((v) => v._id === args.versionId));
      case 'r2.getProjectVersions':
        return versions.filter((v) => v.projectId === args.projectId);
      case 'r2.listProjectVersions':
        return active.map((p) => versionData(versions.find((v) => v._id === p.latestVersionId)));
      case 'r2.searchProjectVersions':
        return active
          .filter((p) => p.name.toLowerCase().includes(args.query.toLowerCase()))
          .map((p) => versionData(versions.find((v) => v._id === p.latestVersionId)));
      default:
        throw new Error(`Unsupported mock query: ${fn}`);
    }
  }
  function record(projectId: string, type: string, summary: string) {
    activity.push({
      _creationTime: Date.now(),
      _id: crypto.randomUUID(),
      projectId,
      summary,
      type,
      userName: page.data.user.name,
    });
  }
  async function mutate(fn: string, args: any): Promise<any> {
    const p = projects.find((p) => p._id === args.projectId);
    switch (fn) {
      case 'links.getOrCreateLink':
        if (p) {
          p.shareToken ??= crypto.randomUUID();
          return { shareToken: p.shareToken };
        }
        break;
      case 'links.revokeLink':
        if (p) p.shareToken = undefined;
        break;
      case 'projects.archiveProject':
        if (p) p.archived = true;
        break;
      case 'projects.createProjectVersion': {
        const versionId = crypto.randomUUID();
        versions.push({
          _id: versionId,
          projectId: args.projectId,
          _creationTime: Date.now(),
          hasModel: false,
          dwgFiles: [],
        });
        record(args.projectId, 'version_created', 'created a revision');
        return { versionId };
      }
      case 'projects.createProjectWithVersion': {
        const projectId = crypto.randomUUID(),
          versionId = crypto.randomUUID();
        projects.push({
          _id: projectId,
          name: args.name,
          latestVersionId: versionId,
          _creationTime: Date.now(),
          archived: false,
        });
        versions.push({
          _id: versionId,
          projectId,
          _creationTime: Date.now(),
          hasModel: false,
          dwgFiles: [],
        });
        record(projectId, 'project_created', 'created this project');
        return { projectId, versionId };
      }
      case 'projects.deleteAllProjects':
        projects.splice(0);
        versions.splice(0);
        break;
      case 'projects.deleteArchivedProject':
        if (p?.archived) projects.splice(projects.indexOf(p), 1);
        break;
      case 'projects.renameProject':
        if (p) {
          p.name = args.name;
          record(p._id, 'project_renamed', 'renamed this project');
        }
        break;
      case 'projects.unarchiveProject':
        if (p) p.archived = false;
        break;
      case 'r2.deleteProjectVersion': {
        const i = versions.findIndex((v) => v._id === args.versionId);
        if (i >= 0) {
          const [v] = versions.splice(i, 1);
          const owner = projects.find((p) => p._id === v.projectId);
          if (owner?.latestVersionId === v._id)
            owner.latestVersionId =
              versions.filter((v) => v.projectId === owner._id).at(-1)?._id ?? null;
        }
        break;
      }
      case 'r2.removeSourceFile':
        for (const v of versions) v.dwgFiles = v.dwgFiles.filter((f: any) => f._id !== args.fileId);
        break;
      case 'users.deleteAccount':
        page.data.user.name = '';
        break;
      case 'users.setName':
        page.data.user.name = args.name;
        break;
      default:
        throw new Error(`Unsupported mock mutation: ${fn}`);
    }
    return {};
  }
  function completeFixtureUpload(versionId: string, name: string) {
    const v = versions.find((v) => v._id === versionId);
    if (!v) return;
    v.hasModel = true;
    v.dwgFiles = fixture.drawings.map((d) => ({
      _id: crypto.randomUUID(),
      name: d.name,
      url: d.url,
    }));
    const p = projects.find((p) => p._id === v.projectId);
    if (p) p.latestVersionId = v._id;
    record(v.projectId, 'file_uploaded', `uploaded ${name}`);
  }
  return {
    completeFixtureUpload,
    mutate,
    page,
    projects,
    query,
    versions,
  };
}
export const [getBackend, setBackend] = createContext<ReturnType<typeof createBackend>>();
