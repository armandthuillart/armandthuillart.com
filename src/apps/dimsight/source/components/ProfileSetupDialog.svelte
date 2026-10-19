<script lang="ts">
  import { invalidate, getPage } from '../mock/navigation.svelte.ts';
  const page = getPage();
  import { AlertDialog } from 'bits-ui';

  import Sprite from '../lib/components/Sprite.svelte';
  import { useMutation } from '../lib/convex.svelte.ts';
  import { api } from '../mock/convex/_generated/api.ts';
  import { ConvexError } from '../mock/convex/error.ts';
  import type { ServerError } from '../mock/convex/types.ts';

  let open = $state(!page.data.user?.name);

  interface Form {
    error: string | null;
    input: HTMLInputElement | null;
    loading: boolean;
    name: string;
  }

  let form = $state<Form>({
    error: null,
    input: null,
    loading: false,
    name: '',
  });

  const setName = useMutation(api.users.setName);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    const name = form.name.trim();
    if (!name) return;

    form.error = null;
    open = false;

    try {
      await setName({ name });
    } catch (error) {
      open = true;
      form.error =
        error instanceof ConvexError
          ? (error.data as ServerError).message
          : 'Something went wrong. Please try again.';
      return;
    }

    form.name = '';

    try {
      await invalidate('app:session');
    } catch {}
  }
</script>

<AlertDialog.Root bind:open>
  <AlertDialog.Portal>
    <AlertDialog.Overlay class="bg-sepia-900/1 fixed inset-0 z-40 backdrop-blur-xs ease-out" />

    <AlertDialog.Content
      class="border-alpha-200 bg-sepia-000 fixed top-1/2 left-1/2 z-50 grid w-full max-w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 gap-5 border p-8 shadow-[0_12px_80px] shadow-black/16 sm:max-w-md md:w-full"
      escapeKeydownBehavior="ignore"
      interactOutsideBehavior="ignore"
      onOpenAutoFocus={(e) => {
        e.preventDefault();
        form.input?.focus();
      }}
    >
      <div class="flex flex-col gap-1 text-center">
        <AlertDialog.Title class="text-lg leading-[1.4] tracking-[-0.03em]">
          What's your name?
        </AlertDialog.Title>

        <AlertDialog.Description class="text-sepia-700 text-sm leading-[1.6]">
          It will make it easier for your colleagues to identify you.
        </AlertDialog.Description>
      </div>

      <form class="flex flex-col gap-4" onsubmit={handleSubmit}>
        <div class="flex flex-col gap-2">
          <input
            bind:this={form.input}
            bind:value={form.name}
            class="border-sepia-400 bg-sepia-200 placeholder:text-sepia-700 focus-within:border-brand-800 h-14 border-b-2 px-4 transition-colors duration-200 focus-within:outline-none"
            placeholder="Your name"
            required
            type="text"
          />

          {#if form.error}
            <p class="text-brick-800 text-sm leading-[1.6]">{form.error}</p>
          {/if}
        </div>

        <button
          class="bg-sepia-900 text-sepia-000 inline-flex h-9 cursor-pointer items-center justify-center gap-2 px-3 disabled:cursor-not-allowed disabled:opacity-40"
          disabled={form.loading || !form.name.trim()}
          type="submit"
        >
          {#if form.loading}
            <Sprite class="size-4 animate-spin [animation-duration:1s]" symbol="spinner" />
          {:else}
            Continue
          {/if}
        </button>
      </form>
    </AlertDialog.Content>
  </AlertDialog.Portal>
</AlertDialog.Root>
