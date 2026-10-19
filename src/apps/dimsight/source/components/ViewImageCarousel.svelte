<script lang="ts">
  import { onMount } from 'svelte';

  import { CAMERA_ANGLES } from '../native/contract.ts';
  import type { CameraAngle } from '../native/contract.ts';

  interface CarouselState {
    index: number;
    stack: HTMLOListElement | undefined;
  }

  interface Props {
    fileName: string;
    viewUrls?: Partial<Record<CameraAngle, string>>;
  }

  let { fileName, viewUrls }: Props = $props();

  let carousel = $state<CarouselState>({
    index: 0,
    stack: undefined,
  });

  onMount(() => {
    const list = carousel.stack;
    if (!list) return;

    const syncIndex = () => {
      carousel.index = Math.round(list.scrollLeft / list.clientWidth);
    };

    list.addEventListener('scroll', syncIndex, { passive: true });

    return () => {
      list.removeEventListener('scroll', syncIndex);
    };
  });

  function slide(index: number) {
    if (!carousel.stack) return;
    carousel.stack.scrollLeft = index * carousel.stack.clientWidth;
  }
</script>

<div class="group relative size-full select-none">
  <ol
    bind:this={carousel.stack}
    class="absolute inset-0 z-1 flex size-full snap-x snap-mandatory scrollbar-none items-center overflow-x-auto overflow-y-hidden scroll-smooth"
  >
    {#each CAMERA_ANGLES as angle (angle)}
      <li class="size-full shrink-0 snap-center snap-always">
        <img
          alt="{fileName} | {angle}"
          class="pointer-events-none size-full shrink-0 object-cover"
          src={viewUrls?.[angle]}
        />
      </li>
    {/each}
  </ol>

  <div
    class="pointer-events-none absolute inset-x-4 top-1/2 z-20 hidden -translate-y-1/2 justify-between opacity-0 group-focus-within:opacity-100 group-hover:opacity-100 pointer-fine:flex"
  >
    {#if carousel.index > 0}
      <button
        aria-label="Previous model view"
        class="bg-sepia-900 text-sepia-000 hover:bg-sepia-800 pointer-events-auto relative flex size-11 cursor-pointer items-center justify-center rounded-full px-3 text-xl before:absolute before:-inset-1"
        onclick={(event) => {
          event.stopPropagation();
          slide(carousel.index - 1);
        }}
      >
        <span class="sr-only">Previous model view</span>
        <span class="font-[system-ui]">←</span>
      </button>
    {:else}
      <span></span>
    {/if}

    {#if carousel.index < CAMERA_ANGLES.length - 1}
      <button
        aria-label="Next model view"
        class="bg-sepia-900 text-sepia-000 hover:bg-sepia-800 pointer-events-auto relative flex size-11 cursor-pointer items-center justify-center rounded-full px-3 text-xl before:absolute before:-inset-1"
        onclick={(event) => {
          event.stopPropagation();
          slide(carousel.index + 1);
        }}
      >
        <span class="sr-only">Next model view</span>
        <span class="font-[system-ui]">→</span>
      </button>
    {:else}
      <span></span>
    {/if}
  </div>

  <div
    class="pointer-events-none absolute bottom-1 z-20 flex h-6 items-center gap-1 px-2 group-hover:opacity-100 max-md:left-1/2 max-md:-translate-x-1/2 md:top-4 md:right-4 md:opacity-0"
  >
    {#each CAMERA_ANGLES as angle, i (angle)}
      <span
        class={['size-1.5 rounded-full', i === carousel.index ? 'bg-sepia-900' : 'bg-sepia-400']}
      ></span>
    {/each}
  </div>
</div>
