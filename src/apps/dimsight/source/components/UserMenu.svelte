<script lang="ts">
  import {
    dev,
    goto,
    resolve,
    getPage,
    posthog,
    mockFetch as fetch,
  } from '../mock/navigation.svelte.ts';
  const page = getPage();
  import { DropdownMenu } from 'bits-ui';

  import Sprite from '../lib/components/Sprite.svelte';
  import SettingsDialog from './SettingsDialog.svelte';

  let open = $state(false);
  let settingsOpen = $state(false);

  async function logout() {
    open = false;
    if (!dev) posthog.reset();
    await fetch('/auth/logout', { method: 'POST' });
    await goto('/');
  }
</script>

<DropdownMenu.Root bind:open>
  <DropdownMenu.Trigger
    class="border-alpha-200 bg-sepia-000 text-sepia-700 hover:bg-sepia-100 flex size-8 cursor-pointer items-center justify-center rounded-full border"
  >
    {#if page.data.user?.name}
      {page.data.user.name.charAt(0).toUpperCase()}
    {:else}
      <Sprite class="size-5" symbol="user-profile" />
    {/if}
  </DropdownMenu.Trigger>

  <DropdownMenu.Portal>
    <DropdownMenu.Content
      align="end"
      class="border-sepia-900 bg-sepia-000 z-50 flex w-50 flex-col border"
      sideOffset={16}
    >
      <DropdownMenu.Group class="flex w-full flex-col px-4.5 py-4">
        <p class="inline-flex items-center gap-2">
          {page.data.user?.name ?? 'Anonymous'}
        </p>

        <p class="text-sepia-700 text-sm leading-[1.6]">
          {page.data.user?.email}
        </p>
      </DropdownMenu.Group>

      <DropdownMenu.Group class="border-sepia-900 flex w-full flex-col border-t">
        <DropdownMenu.Item
          class="group data-highlighted:bg-brand-800 data-highlighted:text-sepia-100 relative flex h-9 cursor-pointer items-center gap-2 px-2.5 text-sm leading-[1.6]"
          onclick={() => (settingsOpen = true)}
        >
          <Sprite class="size-5" symbol="cogwheel" />
          <span>Settings</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item
          class="group data-highlighted:bg-brand-800 data-highlighted:text-sepia-100 relative flex h-9 cursor-pointer items-center gap-2 px-2.5 text-sm leading-[1.6]"
          onclick={() => goto(resolve('home'))}
        >
          <Sprite class="size-5" symbol="plant-details" />
          <span>Website</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item
          class="group data-highlighted:bg-brand-800 data-highlighted:text-sepia-100 relative flex h-9 cursor-pointer items-center gap-2 px-2.5 text-sm leading-[1.6]"
          onclick={logout}
        >
          <Sprite class="size-5" symbol="log-out" />
          <span>Log out</span>
        </DropdownMenu.Item>
      </DropdownMenu.Group>
    </DropdownMenu.Content>
  </DropdownMenu.Portal>
</DropdownMenu.Root>

<SettingsDialog bind:open={settingsOpen} />
