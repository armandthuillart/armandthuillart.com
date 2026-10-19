<script lang="ts">
  import { linear } from 'svelte/easing';
  import { Tween } from 'svelte/motion';

  import Sprite from '../lib/components/Sprite.svelte';
  import type { Symbol } from '../lib/types.ts';

  interface Props {
    class?: string;
    label?: string;
    symbol?: Symbol;
    progress: number;
  }

  let { class: className, label = 'Progress', progress, symbol }: Props = $props();

  const tween = new Tween(0, {
    duration: 600,
    easing: linear,
  });

  $effect(() => {
    tween.target = progress;
  });

  let shown = $derived(tween.current);
</script>

<div
  aria-label={`${label} ${Math.round(shown)}%`}
  aria-valuemax="100"
  aria-valuemin="0"
  aria-valuenow={Math.round(shown)}
  class={[
    'pointer-events-none grid size-5 place-items-center rounded-full',
    symbol ? 'size-4' : 'size-5',
    className,
  ]}
  role="progressbar"
  style="background-image: conic-gradient(var(--sepia-900) var(--progress), var(--sepia-400) 0deg)"
  style:--progress={`${shown * 3.6}deg`}
>
  <div
    class={[
      'bg-sepia-000  rounded-full',
      symbol ? 'flex size-4 items-center justify-center' : 'size-3.5',
    ]}
  >
    {#if symbol}
      <Sprite class="text-sepia-700 size-2.5" {symbol} />
    {/if}
  </div>
</div>
