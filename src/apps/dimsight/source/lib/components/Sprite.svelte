<script lang="ts">
  import type { SVGAttributes } from 'svelte/elements';

  import sprites from '../symbols.ts';

  interface Props extends SVGAttributes<SVGSVGElement> {
    symbol: (typeof sprites)[number];
  }

  let { symbol, ...props }: Props = $props();
</script>

<svg
  aria-hidden="true"
  clip-rule="evenodd"
  fill="currentColor"
  fill-rule="evenodd"
  viewBox={props.viewBox ?? `0 0 16 16`}
  xmlns="http://www.w3.org/2000/svg"
  {...props}
>
  <use href={`/apps/dimsight/sprites.svg#${symbol}`}></use>
</svg>
