<script lang="ts">
  import { useConvex } from './lib/convex.svelte.ts';

  interface LayoutProps {
    data: any;
    children: import('svelte').Snippet;
  }

  let { children, data }: LayoutProps = $props();

  useConvex(() => data.token);
</script>

{@render children()}
