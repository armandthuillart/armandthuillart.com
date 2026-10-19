<script lang="ts">
  import { ContextMenu, DropdownMenu } from 'bits-ui';

  import Sprite from '../lib/components/Sprite.svelte';
  import {
    createProjectActions,
    type MenuItem,
    type UIProjectVersion,
  } from '../lib/project-actions.svelte.ts';
  import { resolve } from '../mock/navigation.svelte.ts';
  import ViewImageCarousel from './ViewImageCarousel.svelte';

  let { file }: { file: NonNullable<UIProjectVersion> } = $props();

  const actions = createProjectActions(() => file);
  const fileName = actions.fileName;
  const editName = actions.editName;
  const saveName = actions.saveName;
</script>

{#snippet menuItems(Item: typeof ContextMenu.Item)}
  {#each actions.items as item (item.label)}
    {#snippet child({ props }: { props: Record<string, unknown> })}
      <div {...props}>
        {@render itemInner(item)}
      </div>
    {/snippet}

    <Item
      {child}
      class="group data-highlighted:bg-brand-800 data-highlighted:text-sepia-100 relative flex h-9 cursor-pointer items-center gap-2 px-2.5 text-sm leading-[1.6]"
      onmouseenter={item.onhover}
      onSelect={() => void item.onclick!()}
    ></Item>
  {/each}
{/snippet}

{#snippet itemInner(item: MenuItem)}
  <Sprite class="relative size-5" symbol={item.symbol} />

  <p class="relative">
    {item.label}
  </p>
{/snippet}

<ContextMenu.Root>
  <ContextMenu.Trigger class="group relative flex flex-col gap-4">
    <div class="bg-sepia-100 relative aspect-square select-none">
      <a
        class="absolute top-1/2 left-1/2 z-2 size-2/3 -translate-1/2 pointer-coarse:hidden"
        href={resolve('/(app)/(private)/f/[id]', { id: file.projectId })}
      >
        <span class="sr-only">Open viewer</span>
      </a>

      <ViewImageCarousel fileName={file.name} viewUrls={file.viewUrls} />

      <div class="pointer-events-none absolute top-4 left-4 z-20 flex">
        {#if file.shareToken}
          <div
            class="bg-sepia-900 text-sepia-000 flex h-6 w-8 gap-1 overflow-hidden px-2 py-1 text-xs transition-[width] group-hover:w-19.5"
          >
            <Sprite class="size-4 shrink-0" symbol="link" />
            <span class="opacity-0 transition-opacity group-hover:opacity-100">Sharing</span>
          </div>
        {/if}
      </div>
    </div>

    <div class="flex items-center justify-between">
      <div class="flex flex-col">
        {#if fileName.dirty}
          <input
            aria-label="File title"
            bind:this={fileName.input}
            bind:value={fileName.value}
            class="bg-sepia-000 relative -mx-1 min-w-0 px-1 shadow-border"
            onblur={(event) => void saveName(event)}
            onclick={(event) => event.stopPropagation()}
            onkeydown={(event) => {
              event.stopPropagation();
              if (event.key === 'Enter') void saveName(event);
              if (event.key === 'Escape') {
                fileName.value = file.name;
                fileName.dirty = false;
              }
            }}
          />
        {:else}
          <button
            class="hover:bg-sepia-300 -mx-1 cursor-text px-1 text-left"
            onclick={(event) => {
              event.stopPropagation();
              editName();
            }}
          >
            <span class="line-clamp-1 truncate">{file.name}</span>
          </button>
        {/if}

        <p class="text-sepia-700 text-sm leading-[1.6]">
          Uploaded {new Date(file._creationTime).toLocaleDateString('en-US', {
            day: 'numeric',
            year: 'numeric',
            month: 'short',
          })}
        </p>
      </div>

      <DropdownMenu.Root>
        <DropdownMenu.Trigger
          class="hover:bg-sepia-300 flex size-9 shrink-0 cursor-pointer items-center justify-center"
          onclick={(event) => event.stopPropagation()}
        >
          <span class="sr-only">Project actions</span>
          <Sprite class="size-6" symbol="ellipsis" />
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            class="border-sepia-900 bg-sepia-000 z-50 flex w-45 flex-col items-stretch border select-none"
            side="top"
          >
            {@render menuItems(DropdownMenu.Item)}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  </ContextMenu.Trigger>

  <ContextMenu.Portal>
    <ContextMenu.Content
      class="border-sepia-900 bg-sepia-000 z-50 flex w-45 flex-col items-stretch border select-none"
    >
      {@render menuItems(ContextMenu.Item)}
    </ContextMenu.Content>
  </ContextMenu.Portal>
</ContextMenu.Root>
