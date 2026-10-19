<script lang="ts">
  import { onMount } from 'svelte';

  import { usePaginatedQuery, useQuery } from './source/lib/convex.svelte';
  import { createBackend, setBackend } from './source/mock/backend.svelte';
  import { api } from './source/mock/convex/_generated/api';
  import { goto } from './source/mock/navigation.svelte';
  import PrivateLayout from './source/PrivateLayout.svelte';
  import ProjectsPage from './source/ProjectsPage.svelte';
  import ViewerPage from './source/ViewerPage.svelte';

  import './source/app.css';

  let { locale = 'en' }: { locale?: string } = $props();
  const backend = createBackend();
  setBackend(backend);
  let projectId = $state<string | undefined>();
  const projects = usePaginatedQuery(
    api.projects.listProjects,
    () => ({ order: backend.page.url.searchParams.get('order') ?? 'desc' }),
    { initialNumItems: 8 },
  );
  const project = useQuery(api.projects.getProject, () => (projectId ? { projectId } : 'skip'));
  const data = {
    get organization() {
      return backend.page.data.organization;
    },
    projects,
    get sortOrder() {
      return backend.page.url.searchParams.get('order') === 'asc' ? 'asc' : 'desc';
    },
    get user() {
      return backend.page.data.user;
    },
    versions: {},
  };
  function follow(event: MouseEvent) {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    )
      return;
    const anchor = (event.target as Element).closest('a');
    if (anchor?.getAttribute('href')?.startsWith('#dimsight')) {
      event.preventDefault();
      void goto(anchor.getAttribute('href')!);
    }
  }
  function syncNavigation() {
    backend.page.url = new URL(window.location.href);
    const match = window.location.hash.match(/^#dimsight\/(f|s)\/([^?]+)/);
    const id = match ? decodeURIComponent(match[2]) : undefined;
    projectId =
      match?.[1] === 's'
        ? (backend.projects.find((p) => p.shareToken === id)?._id ?? 'unavailable')
        : id;
  }
  onMount(() => {
    syncNavigation();
    window.addEventListener('dimsight:navigate', syncNavigation);
    return () => window.removeEventListener('dimsight:navigate', syncNavigation);
  });
</script>

<svelte:window onhashchange={syncNavigation} onpopstate={syncNavigation} onclick={follow} />

<PrivateLayout data={{ token: 'mock' }}>
  {#if projectId}
    <ViewerPage data={{ project }} />
  {:else}
    <ProjectsPage {data} />
  {/if}
</PrivateLayout>
