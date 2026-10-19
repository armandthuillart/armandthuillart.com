<script lang="ts">
  import { useQuery, type QueryResult } from '../lib/convex.svelte.ts';
  import { api } from '../mock/convex/_generated/api.ts';
  import type { FunctionReturnType } from '../mock/types.ts';
  import ProjectCell from './ProjectCell.svelte';
  import ProjectRow from './ProjectRow.svelte';

  interface Props {
    layout: UILayout;
    preloaded?: QueryResult<typeof api.r2.getProjectVersion>;
    project: FunctionReturnType<typeof api.projects.listProjects>['page'][number];
  }

  type UILayout = 'grid' | 'list';

  let { layout, preloaded, project }: Props = $props();

  const fallback = useQuery(api.r2.getProjectVersion, () => {
    if (preloaded) return 'skip';
    const versionId = project.latestVersionId;
    return versionId ? { versionId } : 'skip';
  });

  let version = $derived(preloaded ?? fallback);
  let file = $derived(version.data?.viewUrls ? version.data : undefined);
</script>

{#if file}
  {#if layout === 'grid'}
    <ProjectCell {file} />
  {:else}
    <ProjectRow {file} />
  {/if}
{/if}
