<script lang="ts">
  import Sprite from '../lib/components/Sprite.svelte';

  let { addFiles }: { addFiles: (files: File[]) => void } = $props();

  let input = $state<HTMLInputElement>();
  let error = $state<null | string>(null);
  let dragging = $state(false);

  const SUPPORTED_PROTOCOLS = new Set(['AP203', 'AP214', 'AP242']);
  const NAMED_SCHEMAS = {
    AUTOMOTIVE_DESIGN: 'AP214',
    CONFIG_CONTROL_DESIGN: 'AP203',
  } as const;

  function getProtocol(header: string) {
    const schema = /FILE_SCHEMA\s*\(\s*\(\s*'([^']+)'/i.exec(header)?.[1];
    if (!schema) return null;

    const schemas = Object.entries(NAMED_SCHEMAS).find(([name]) =>
      schema.toUpperCase().includes(name),
    );
    if (schemas) return schemas[1];

    return (
      schema
        .replace(/\s*\{.*$/, '')
        .trim()
        .split('_')[0] || null
    );
  }

  async function select(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files];

    const file = list.find((file) => /\.(?:step|stp)$/i.test(file.name));

    if (!file) {
      const match = /\.([^.]+)$/.exec(list[0].name);
      const found = match ? match[1].toUpperCase() : null;
      error = found ? `${found} is not supported` : 'Unsupported protocol';
      return;
    }

    const header = await file.slice(0, 8192).text();
    const flagged = getProtocol(header);

    if (!flagged || !SUPPORTED_PROTOCOLS.has(flagged)) {
      error = `${flagged ? `${flagged} is not supported` : 'Unsupported protocol'}`;
      return;
    }

    error = null;
    addFiles(list);
  }
</script>

<input
  accept=".step,.stp"
  aria-label="Upload files"
  bind:this={input}
  class="sr-only"
  multiple
  name="upload"
  onchange={(event) => {
    select(event.currentTarget.files);
    event.currentTarget.value = '';
  }}
  type="file"
/>

<div
  class={[
    'group relative flex h-48 cursor-pointer flex-col items-center border pt-8',
    error
      ? 'border-brick-800/50 bg-brick-800/5 hover:bg-brick-800/10 data-dragging:border-brick-800/70 data-dragging:bg-brick-800/10'
      : 'border-alpha-200 bg-sepia-000 hover:bg-sepia-100 data-dragging:border-brand-800/50 data-dragging:bg-brand-800/5 data-dragging:border-dashed',
  ]}
  data-dragging={dragging || undefined}
  onclick={() => input?.click()}
  ondragenter={(event) => {
    event.preventDefault();
    dragging = true;
  }}
  ondragleave={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) dragging = false;
  }}
  ondragover={(event) => event.preventDefault()}
  ondrop={(event) => {
    event.preventDefault();
    dragging = false;
    select(event.dataTransfer?.files ?? null);
  }}
  onkeydown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      input?.click();
    }
  }}
  role="button"
  tabindex="0"
>
  <div class="flex flex-col items-center gap-1.5">
    <Sprite class={['size-16', error ? 'text-brick-800' : 'text-sepia-600']} symbol="download" />

    <div class="flex flex-col gap-0.5 text-center text-sm leading-[1.6]">
      {#if error}
        <p class="text-brick-800">{error}</p>
        <p class="text-brick-800">AP203, AP214, or AP242 are supported.</p>
      {:else}
        <p>Drag and drop your files here</p>
        <p class="text-sepia-700">Only STEP/STP files are supported.</p>
      {/if}
    </div>
  </div>
</div>
