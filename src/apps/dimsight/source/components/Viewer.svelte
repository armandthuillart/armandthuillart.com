<script lang="ts">
  import { ContextMenu, Popover, Select, Slider, Tabs, Toggle, Tooltip } from 'bits-ui';
  import { untrack } from 'svelte';

  import Sprite from '../lib/components/Sprite.svelte';
  import type { Symbol } from '../lib/types.ts';
  import {
    DEFAULT_UI_VISUAL_STYLE,
    UI_CAMERA_ANGLES,
    UI_CUTTING_PLANES,
    UI_MEASUREMENT_TOOLS,
    UI_VIEW_MODES,
    UI_VISUAL_STYLES,
  } from '../lib/viewer/constants.ts';
  import { Viewer } from '../lib/viewer/index.ts';
  import type {
    UICuttingPlane,
    UIMeasurementTool,
    UIVisualStyle,
    UICameraAngle,
    ViewerStatus,
    UIViewMode,
    Toolbar3dTools,
    Toolbar2dTools,
  } from '../lib/viewer/types.ts';
  import { resolve } from '../mock/navigation.svelte.ts';
  import { DRAWING_VIEWS, type CameraAngle, type DrawingView } from '../native/contract.ts';

  type ButtonTool = {
    symbol: Symbol;
    tooltip: string;
    variant: 'button';
    onclick: () => void;
    disabled?: boolean;
  };
  type Config = {
    canvas: HTMLCanvasElement | undefined;
    root: HTMLDivElement | undefined;
  };
  type DrawingLayer = 'center' | 'dimensions' | 'hidden' | 'section';

  type DrawingPreset = string;

  type DrawingStrokeLayer = DrawingLayer | 'visible';

  type MenuOption = {
    symbol: Symbol;
    tooltip: string;
    onclick: () => void;
    pressed?: boolean;
    behavior: 'command' | 'single' | 'multiple';
  };

  type MenuTool = {
    menu: {
      side: 'top';
      columns: number;
      tooltipSide: 'right' | 'top';
      options: MenuOption[];
    };
    symbol: Symbol;
    variant: 'menu';
    tooltip: string;
    disabled?: boolean;
  };

  type Store = {
    autoRotate: boolean;
    boundingBox: boolean;
    cuttingPlanes: Record<UICuttingPlane, boolean>;
    cameraAngle: UICameraAngle;
    drawingAngle: DrawingPreset;
    explosion: number;
    explosionOpen: boolean;
    measurementTool: UIMeasurementTool | null;
    toggleCenterLines: boolean;
    toggleDimensions: boolean;
    toggleHashes: boolean;
    toggleHiddenLines: boolean;
    toggleSourceLabels: boolean;
    viewerStatus: ViewerStatus;
    visualStyle: UIVisualStyle;
  };

  type ToggleTool = {
    symbol: Symbol;
    tooltip: string;
    pressed: boolean;
    variant: 'toggle';
    disabled?: boolean;
    onPressedChange: (pressed: boolean) => void;
  };

  type Toolbar3dTool = ButtonTool | ToggleTool | MenuTool;

  type ViewerFile = {
    drawings: Array<{ fileId: string; name: string; url: string; view?: DrawingView }>;
    glbUrl?: string;
    manifestUrl?: string;
    name: string;
    viewUrls?: Partial<Record<CameraAngle, string>>;
  };

  const cameraSymbol = (angle: UICameraAngle) => `camera-angle-${angle}` as Symbol;
  const cuttingPlaneSymbol = (plane: UICuttingPlane) => `cut-${plane}` as Symbol;

  const emptyFile: ViewerFile = {
    drawings: [],
    name: '',
  };

  let { file: propFile }: { file?: ViewerFile } = $props();
  let file = $derived(propFile ?? emptyFile);

  let viewer = $state<Viewer | null>(null);
  let config = $state<Config>({ canvas: undefined, root: undefined });
  let viewMode = $state<UIViewMode>('3d');
  let drawingsReady = $derived(file.drawings.length > 0);
  let manifestReady = $derived(!!file.manifestUrl);

  let store = $state<Store>({
    autoRotate: false,
    boundingBox: false,
    cameraAngle: 'isometric',
    cuttingPlanes: {
      diagonal: false,
      right: false,
      top: false,
    },
    drawingAngle: 'both',
    explosion: 0,
    explosionOpen: false,
    measurementTool: null,
    toggleCenterLines: true,
    toggleDimensions: true,
    toggleHashes: true,
    toggleHiddenLines: false,
    toggleSourceLabels: false,
    viewerStatus: 'empty',
    visualStyle: DEFAULT_UI_VISUAL_STYLE,
  });

  let loadedDrawing = $state<{
    drawingIds: string[];
    preset: DrawingPreset;
  } | null>(null);

  function drawingLabel(view: DrawingView | undefined, name: string) {
    return view ? `${view[0]!.toUpperCase()}${view.slice(1)}` : name;
  }

  function drawingName(name: string) {
    return name.replace(/\.[^.]+$/, '') || 'Technical drawing';
  }

  function isOrthographicSheet(drawings: ViewerFile['drawings']) {
    if (drawings.length !== 3) return false;

    const views = new Set(drawings.map((drawing) => drawing.view));
    const orthographicViews = ['front', 'right', 'top'] as const;
    return views.size === 3 && orthographicViews.every((view) => views.has(view));
  }

  let drawingOptions = $derived([
    { label: isOrthographicSheet(file.drawings) ? 'Sheet' : 'All drawings', value: 'both' },
    ...DRAWING_VIEWS.flatMap((view) => {
      const drawing = file.drawings.find((candidate) => candidate.view === view);
      return drawing ? [{ label: drawingLabel(view, drawing.name), value: view }] : [];
    }),
    ...file.drawings
      .filter((drawing) => !drawing.view)
      .map((drawing) => ({ label: drawing.name, value: drawing.fileId })),
  ]);

  let drawingReady = $derived.by(() => {
    const drawingIds =
      store.drawingAngle === 'both'
        ? file.drawings.map((drawing) => drawing.fileId)
        : file.drawings
            .filter((drawing) => (drawing.view ?? drawing.fileId) === store.drawingAngle)
            .map((drawing) => drawing.fileId);

    return (
      drawingIds.length > 0 &&
      loadedDrawing?.preset === store.drawingAngle &&
      loadedDrawing?.drawingIds.length === drawingIds.length &&
      loadedDrawing.drawingIds.every((id, index) => id === drawingIds[index])
    );
  });

  $effect(() => {
    if (!config.canvas || !config.root) return;

    const handle = new Viewer(config.canvas, {
      bottomInset: 60,
      onPartMenuRequested: ({ x, y }) => {
        config.canvas?.dispatchEvent(
          new MouseEvent('contextmenu', {
            bubbles: true,
            button: 2,
            cancelable: true,
            clientX: x,
            clientY: y,
          }),
        );
      },
    });

    viewer = handle;

    const unsubscribe = handle.subscribe((state) => {
      store.autoRotate = state.autoRotationEnabled;
      store.boundingBox = state.boundingBoxVisible;
      store.cuttingPlanes = { ...state.cuttingPlanes };
      store.cameraAngle = state.cameraAngle;
      store.explosion = state.explosion;
      store.measurementTool = state.activeTool;
      store.visualStyle = state.visualStyle;
      store.viewerStatus = state.status;
    });

    let frame: number | undefined;

    let w = 0;
    let h = 0;

    const observer = new ResizeObserver(([entry]) => {
      if (!entry) return;

      w = entry.contentRect.width;
      h = entry.contentRect.height;

      if (frame !== undefined) return;

      frame = requestAnimationFrame(() => {
        frame = undefined;
        handle.resize(w, h);
      });
    });

    observer.observe(config.root);

    const { glbUrl: visualizationUrl, name } = untrack(() => file);
    if (visualizationUrl) {
      void handle.load({ name, visualizationUrl });
    }

    return () => {
      observer.disconnect();
      if (frame !== undefined) cancelAnimationFrame(frame);
      unsubscribe();
      handle.dispose();
      viewer = null;
    };
  });

  $effect(() => {
    if (!viewer || store.viewerStatus !== 'ready' || !file.manifestUrl) return;
    void viewer.attachManifest(file.manifestUrl);
  });

  $effect(() => {
    if (!viewer) return;
    viewer.setPaused(viewMode === '2d');
  });

  const toolbar3dTools = $derived.by(
    () =>
      ({
        autoRotate: {
          onPressedChange: () => viewer?.toggleAutoRotation(),
          pressed: store.autoRotate,
          symbol: 'auto-rotate',
          tooltip: 'Rotate model',
          variant: 'toggle',
        },
        boundingBox: {
          disabled: !manifestReady,
          onPressedChange: () => viewer?.toggleBoundingBox(),
          pressed: store.boundingBox,
          symbol: 'bounding-box',
          tooltip: 'Show dimensions',
          variant: 'toggle',
        },
        cameraAngles: {
          menu: {
            columns: 3,
            options: UI_CAMERA_ANGLES.map((angle) => ({
              behavior: 'command',
              onclick: () => viewer?.setCameraAngle(angle),
              symbol: cameraSymbol(angle),
              tooltip: angle.charAt(0).toUpperCase() + angle.slice(1).replaceAll('-', ' '),
            })),
            side: 'top',
            tooltipSide: 'top',
          },
          symbol: cameraSymbol(store.cameraAngle),
          tooltip: 'Camera angle',
          variant: 'menu',
        },
        cuttingPlanes: {
          disabled: store.viewerStatus !== 'ready',
          menu: {
            columns: 1,
            options: UI_CUTTING_PLANES.map((plane) => ({
              behavior: 'multiple',
              onclick: () => viewer?.toggleCuttingPlane(plane),
              pressed: store.cuttingPlanes[plane],
              symbol: cuttingPlaneSymbol(plane),
              tooltip:
                plane === 'top'
                  ? 'Top cutting plane'
                  : plane === 'right'
                    ? 'Right cutting plane'
                    : '45° cutting plane',
            })),
            side: 'top',
            tooltipSide: 'right',
          },
          symbol: 'cut',
          tooltip: 'Cutting planes',
          variant: 'menu',
        },
        measurementTools: {
          disabled: !manifestReady,
          menu: {
            columns: 1,
            options: UI_MEASUREMENT_TOOLS.map((tool) => ({
              behavior: 'single',
              onclick: () => viewer?.toggleTool(tool),
              pressed: store.measurementTool === tool,
              symbol: tool,
              tooltip: tool.charAt(0).toUpperCase() + tool.slice(1).replaceAll('-', ' '),
            })),
            side: 'top',
            tooltipSide: 'right',
          },
          symbol: store.measurementTool ?? 'point-to-point',
          tooltip: 'Measurement tools',
          variant: 'menu',
        },
        resetAll: {
          onclick: () => viewer?.reset(),
          symbol: 'reset',
          tooltip: 'Reset',
          variant: 'button',
        },
        takeScreenshot: {
          onclick: async () => {
            const blob = await viewer?.captureScreenshot();
            if (!blob) return;

            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${file.name.replace(/\.[^.]+$/, '')}.webp`;
            link.click();
            URL.revokeObjectURL(url);
          },
          symbol: 'screenshot',
          tooltip: 'Screenshot',
          variant: 'button',
        },
        visualStyles: {
          menu: {
            columns: 1,
            options: UI_VISUAL_STYLES.map((style) => ({
              behavior: 'single',
              onclick: () => viewer?.setVisualStyle(style),
              pressed: store.visualStyle === style,
              symbol: style,
              tooltip: style.charAt(0).toUpperCase() + style.slice(1).replaceAll('-', ' '),
            })),
            side: 'top',
            tooltipSide: 'right',
          },
          symbol: store.visualStyle,
          tooltip: 'Visual style',
          variant: 'menu',
        },
      }) satisfies Record<Toolbar3dTools, Toolbar3dTool>,
  );

  let drawingRoot = $state<HTMLElement | null>(null);
  const drawingLayerSelectors = [
    ['hidden', '[data-layer="hidden"]'],
    ['center', '[data-layer="center"]'],
    ['section', '[data-layer="section"]'],
    ['dimensions', '[data-layer="dimensions"]'],
  ] as const satisfies ReadonlyArray<readonly [DrawingLayer, string]>;

  type DrawingCapability = DrawingLayer | 'sourceLabels';

  function isBareSourceLabel(text: SVGTextElement) {
    return /^\d{1,2}$/.test(text.textContent?.trim() ?? '');
  }

  function unresolvedSourceLabels(svg: SVGSVGElement) {
    const texts = [...svg.querySelectorAll<SVGTextElement>('text')];
    const hasSemanticTextKinds = texts.some((text) => text.dataset.textKind);
    const bareDimensionLabels = texts.filter(
      (text) => isBareSourceLabel(text) && text.dataset.textKind === 'dimension',
    );
    const looksLikeUnresolvedIndexSet =
      bareDimensionLabels.length >= 4 &&
      new Set(bareDimensionLabels.map((text) => text.textContent?.trim())).size >= 3;

    return texts.filter((text) => {
      if (!isBareSourceLabel(text)) return false;
      if (text.dataset.textKind === 'dimension') return looksLikeUnresolvedIndexSet;
      if (text.dataset.textKind === 'source') return true;
      return !hasSemanticTextKinds && text.closest('[data-layer="dimensions"]') !== null;
    });
  }
  let drawingCapabilities = $state<Record<DrawingCapability, boolean>>({
    center: false,
    dimensions: false,
    hidden: false,
    section: false,
    sourceLabels: false,
  });
  let has2dTools = $derived(
    drawingCapabilities.center ||
      drawingCapabilities.dimensions ||
      drawingCapabilities.hidden ||
      drawingCapabilities.section ||
      drawingCapabilities.sourceLabels,
  );

  function setDrawingToggles(
    toggles: Record<DrawingCapability, boolean> = {
      center: store.toggleCenterLines,
      dimensions: store.toggleDimensions,
      hidden: store.toggleHiddenLines,
      section: store.toggleHashes,
      sourceLabels: store.toggleSourceLabels,
    },
  ) {
    const root = drawingRoot;
    const capabilities: Record<DrawingCapability, boolean> = {
      center: false,
      dimensions: false,
      hidden: false,
      section: false,
      sourceLabels: false,
    };
    for (const [layer, selector] of drawingLayerSelectors) {
      const groups = root ? [...root.querySelectorAll<SVGGElement>(selector)] : [];
      capabilities[layer] = groups.some((group) => group.childElementCount > 0);

      groups.forEach((group) => {
        group.classList.remove('hidden');
        group.style.display = toggles[layer] ? '' : 'none';
      });
    }

    const sourceLabels = root
      ? [...root.querySelectorAll<SVGSVGElement>('svg')].flatMap(unresolvedSourceLabels)
      : [];
    sourceLabels.forEach((text) => {
      text.style.display = toggles.sourceLabels ? '' : 'none';
    });
    capabilities.sourceLabels = sourceLabels.length > 0;

    drawingCapabilities = capabilities;
    if (!root) return;
    root.querySelectorAll<SVGSVGElement>('svg').forEach(reframeDrawing);
  }

  let drawingLoad = 0;
  const drawingCache = new Map<string, SVGSVGElement>();
  const drawingViewBoxes = new WeakMap<SVGSVGElement, string>();
  const drawingStrokeRules: Record<
    DrawingStrokeLayer,
    {
      min: number;
      max: number;
      scale: number;
    }
  > = {
    center: {
      max: 1.05,
      min: 0.65,
      scale: 1.6,
    },
    dimensions: {
      max: 1.6,
      min: 0.9,
      scale: 2.4,
    },
    hidden: {
      max: 0.85,
      min: 0.55,
      scale: 1.2,
    },
    section: {
      max: 1.25,
      min: 0.8,
      scale: 2.1,
    },
    visible: {
      max: 2.1,
      min: 1.15,
      scale: 3.4,
    },
  };
  const drawingTextMin = 11;
  const drawingLayerClasses: Record<DrawingStrokeLayer, string[]> = {
    center: ['text-brick-800'],
    dimensions: ['text-sepia-900'],
    hidden: ['text-sepia-500'],
    section: ['text-sepia-700'],
    visible: ['text-sepia-900'],
  };

  async function fetchDrawing(drawing: ViewerFile['drawings'][number]) {
    const url = drawing.url;

    if (drawingCache.has(drawing.fileId)) {
      return drawingCache.get(drawing.fileId)!;
    }

    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) throw new Error(`Drawing fetch failed: ${res.status}`);
    const text = await res.text();
    const svg = new DOMParser().parseFromString(text, 'image/svg+xml')
      .documentElement as unknown as SVGSVGElement;
    svg.classList.add('size-full');
    drawingCache.set(drawing.fileId, svg);
    return svg;
  }

  async function loadDrawing(preset: DrawingPreset) {
    const drawings =
      preset === 'both'
        ? file.drawings
        : file.drawings.filter((drawing) => (drawing.view ?? drawing.fileId) === preset);

    if (!drawingRoot || drawings.length === 0 || !drawingsReady) {
      loadedDrawing = null;
      drawingRoot?.replaceChildren();
      setDrawingToggles();
      return;
    }

    const id = ++drawingLoad;
    drawingRoot.replaceChildren();
    setDrawingToggles();
    try {
      const svgs = await Promise.all(drawings.map((drawing) => fetchDrawing(drawing)));

      if (id !== drawingLoad || !drawingRoot) return;
      mountDrawings(svgs, drawings, preset === 'both' && svgs.length > 1, file.name);
      setDrawingToggles();
      loadedDrawing = { drawingIds: drawings.map((drawing) => drawing.fileId), preset };
    } catch {
      if (id === drawingLoad && drawingRoot) {
        drawingRoot.replaceChildren();
        loadedDrawing = null;
        setDrawingToggles();
      }
    }
  }

  function mountDrawings(
    svgs: SVGSVGElement[],
    drawings: ViewerFile['drawings'],
    both: boolean,
    fileName: string,
  ) {
    const root = drawingRoot;
    if (!root) return;

    if (!both) {
      root.style.width = '';
      root.style.height = '';
      root.style.minWidth = '';
      root.style.minHeight = '';
      svgs[0]!.style.width = '';
      svgs[0]!.style.height = '';
      root.replaceChildren(svgs[0]!);
      normalizeDrawing(svgs[0]!);
      return;
    }

    if (isOrthographicSheet(drawings)) {
      const sheet = document.createElement('div');
      sheet.className =
        'flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden border border-sepia-900 aspect-auto sm:aspect-[1.4142] sm:w-auto';

      const views = document.createElement('div');
      views.dataset.sheetViews = '';
      views.className =
        'flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:grid md:grid-cols-2 md:grid-rows-2 md:overflow-hidden';

      for (const [index, svg] of svgs.entries()) {
        const drawing = drawings[index]!;
        const view = drawing.view ?? 'projected';
        const cell = document.createElement('div');
        const placement =
          view === 'front'
            ? 'md:col-start-1 md:row-start-1'
            : view === 'right'
              ? 'md:col-start-2 md:row-start-1'
              : view === 'top'
                ? 'md:col-start-1 md:row-start-2'
                : '';
        cell.dataset.sheetView = view;
        cell.className = `flex h-64 min-w-0 flex-col md:h-auto md:min-h-0 ${placement}`;

        const label = document.createElement('div');
        label.dataset.sheetViewLabel = '';
        label.className =
          'shrink-0 pb-1 font-mono text-xs font-semibold tracking-wider text-sepia-700 uppercase';
        label.textContent = drawingLabel(drawing.view, drawing.name).toUpperCase();

        const surface = document.createElement('div');
        surface.dataset.sheetViewSurface = '';
        surface.className =
          'flex min-h-0 min-w-0 flex-1 items-center justify-center overflow-hidden';

        svg.dataset.sheetSvg = '';
        svg.classList.add('block', 'size-full', 'min-w-0', 'min-h-0');
        surface.append(svg);
        cell.append(label, surface);
        views.append(cell);
      }

      const footer = document.createElement('div');
      footer.dataset.sheetFooter = '';
      footer.className = 'flex justify-end';

      const footerRight = document.createElement('div');
      footerRight.dataset.sheetFooterRight = '';
      footerRight.className = 'flex w-full flex-col sm:w-auto sm:border-l sm:border-sepia-900';

      const notes = document.createElement('div');
      notes.dataset.sheetNotes = '';
      notes.className = 'flex flex-col border-t border-sepia-900 p-2';

      const notesLabel = document.createElement('div');
      notesLabel.dataset.sheetNotesLabel = '';
      notesLabel.className = 'font-mono text-xs font-medium text-sepia-700 uppercase';
      notesLabel.textContent = 'General notes';

      const notesNote = document.createElement('div');
      notesNote.dataset.sheetNotesNote = '';
      notesNote.className = 'text-xs font-medium';
      notesNote.textContent = 'Source annotations preserved';
      notes.append(notesLabel, notesNote);

      const titleBlock = document.createElement('div');
      titleBlock.dataset.sheetTitleBlock = '';
      titleBlock.className =
        'grid w-full min-w-0 grid-cols-5 grid-rows-3 border-t border-sepia-900 font-mono text-xs uppercase';

      const addTitleBlockCell = (
        labelText: string,
        valueText: string,
        layoutClass: string,
        edgeClass: string,
      ) => {
        const cell = document.createElement('div');
        const cellIndex = titleBlock.childElementCount;
        cell.dataset.sheetTitleCell = '';
        cell.className = `flex min-w-0 flex-col gap-1 p-2 ${edgeClass} ${cellIndex >= 2 ? 'border-t border-sepia-900' : ''} ${layoutClass}`;

        const label = document.createElement('span');
        label.className = 'text-xs font-medium text-sepia-700';
        label.textContent = labelText;

        const value = document.createElement('strong');
        value.className = 'min-w-0 break-words whitespace-normal text-xs';
        value.textContent = valueText;
        value.title = valueText;

        cell.append(label, value);
        titleBlock.append(cell);
      };

      addTitleBlockCell('Title', drawingName(fileName), 'col-span-2 row-span-2', '');
      addTitleBlockCell('Drawing no.', 'Source', 'col-span-3 col-start-3 row-start-1', 'border-l');
      addTitleBlockCell('Revision', 'N/A', 'col-start-3 row-start-2', 'border-l');
      addTitleBlockCell('Scale', 'NTS', 'col-start-4 row-start-2', 'border-l');
      addTitleBlockCell('Sheet', '1 / 1', 'col-start-5 row-start-2', 'border-l');
      addTitleBlockCell('Brand', 'Dimsight', 'col-span-2 col-start-1 row-start-3', '');
      addTitleBlockCell('Units', 'N/A', 'col-start-3 row-start-3', 'border-l');
      addTitleBlockCell('Status', 'View only', 'col-span-2 col-start-4 row-start-3', 'border-l');

      footerRight.append(notes, titleBlock);
      footer.append(footerRight);
      sheet.append(views, footer);
      root.replaceChildren(sheet);
      svgs.forEach(normalizeDrawing);
      return;
    }

    root.style.width = '100%';
    root.style.height = '100%';
    root.style.minWidth = '0';
    root.style.minHeight = '0';

    const layout = document.createElement('div');
    layout.className =
      'grid size-full grid-cols-1 gap-3 overflow-auto p-3 sm:grid-cols-2 xl:grid-cols-3';
    layout.style.gridAutoRows = 'minmax(11rem, 1fr)';

    for (const [index, svg] of svgs.entries()) {
      const drawing = drawings[index]!;
      const tile = document.createElement('div');
      tile.className = 'flex min-h-0 min-w-0 flex-col border border-sepia-300 bg-sepia-000';

      const label = document.createElement('div');
      label.className =
        'min-w-0 shrink-0 truncate border-b border-sepia-200 px-2 py-1 text-center text-xs font-medium text-sepia-700';
      label.textContent = drawingLabel(drawing.view, drawing.name);
      label.title = drawing.name;

      const surface = document.createElement('div');
      surface.className = 'flex min-h-0 min-w-0 flex-1 items-center justify-center';

      svg.style.width = '100%';
      svg.style.height = '100%';
      surface.append(svg);
      tile.append(label, surface);
      layout.append(tile);
    }

    root.replaceChildren(layout);
    svgs.forEach(normalizeDrawing);
  }

  function normalizeDrawing(svg: SVGSVGElement) {
    svg.style.setProperty('shape-rendering', 'geometricPrecision');
    svg.style.setProperty('text-rendering', 'geometricPrecision');

    svg.querySelectorAll<SVGGElement>('[data-layer]').forEach((group) => {
      const layer = (group.dataset.layer ?? 'visible') as DrawingStrokeLayer;
      group.classList.add(...(drawingLayerClasses[layer] ?? drawingLayerClasses.visible));
    });

    const viewBox = svg.viewBox.baseVal;
    const bounds = svg.getBoundingClientRect();
    const scale =
      viewBox.width > 0 && viewBox.height > 0
        ? Math.min(bounds.width / viewBox.width, bounds.height / viewBox.height)
        : 0;

    for (const element of svg.querySelectorAll<SVGElement>('*')) {
      const originalStrokeWidth =
        element.dataset.drawingStrokeWidth ??
        (element.style.getPropertyValue('stroke-width') || element.getAttribute('stroke-width'));
      const strokeWidth = Number.parseFloat(originalStrokeWidth ?? '');
      const layer = (element.closest<SVGGElement>('[data-layer]')?.dataset.layer ??
        'visible') as DrawingStrokeLayer;
      const strokeRule = drawingStrokeRules[layer] ?? drawingStrokeRules.visible;
      if (Number.isFinite(strokeWidth)) {
        element.dataset.drawingStrokeWidth = originalStrokeWidth!;
        element.setAttribute('vector-effect', 'non-scaling-stroke');
        element.style.setProperty(
          'stroke-width',
          `${Math.min(strokeRule.max, Math.max(strokeRule.min, strokeWidth * strokeRule.scale))}px`,
        );
      }

      const dashArray =
        element.style.getPropertyValue('stroke-dasharray') ||
        element.getAttribute('stroke-dasharray');
      if (layer === 'center') {
        element.style.setProperty('stroke-dasharray', '10px 4px 2px 4px');
      } else if (
        layer === 'hidden' &&
        (!dashArray || dashArray === 'none' || dashArray === 'inherit')
      ) {
        element.style.setProperty('stroke-dasharray', '6px 4px');
      } else if (dashArray && dashArray !== 'none' && dashArray !== 'inherit') {
        const values = dashArray
          .split(/[\s,]+/)
          .map(Number)
          .filter(Number.isFinite);
        const largest = Math.max(...values);
        if (values.length > 0 && largest > 0) {
          const dashScale = Math.max(1, 4 / largest);
          element.style.setProperty(
            'stroke-dasharray',
            values.map((value) => `${Math.max(2, value * dashScale)}px`).join(' '),
          );
        }
      }

      const fontSize = numericSvgValue(element, 'font-size');
      if (fontSize !== undefined && scale > 0) {
        element.style.setProperty('font-size', `${Math.max(fontSize, drawingTextMin / scale)}`);
      }
    }
  }

  function numericSvgValue(element: SVGElement, name: string) {
    const value = element.style.getPropertyValue(name) || element.getAttribute(name);
    const parsed = Number.parseFloat(value ?? '');
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function reframeDrawing(svg: SVGSVGElement) {
    const originalViewBox = drawingViewBoxes.get(svg) ?? svg.getAttribute('viewBox');
    if (!originalViewBox) return;
    drawingViewBoxes.set(svg, originalViewBox);

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    svg.querySelectorAll<SVGGElement>('[data-layer]').forEach((group) => {
      if (group.style.display === 'none') return;

      const bounds = group.getBBox();
      if (bounds.width === 0 && bounds.height === 0) return;
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.x + bounds.width);
      maxY = Math.max(maxY, bounds.y + bounds.height);
    });

    if (![minX, minY, maxX, maxY].every(Number.isFinite)) {
      svg.setAttribute('viewBox', originalViewBox);
      return;
    }

    const width = maxX - minX;
    const height = maxY - minY;
    const padding = Math.max(width, height) * 0.04;
    svg.setAttribute(
      'viewBox',
      `${minX - padding} ${minY - padding} ${width + padding * 2} ${height + padding * 2}`,
    );
  }

  $effect(() => void loadDrawing(store.drawingAngle));
  $effect(() =>
    setDrawingToggles({
      center: store.toggleCenterLines,
      dimensions: store.toggleDimensions,
      hidden: store.toggleHiddenLines,
      section: store.toggleHashes,
      sourceLabels: store.toggleSourceLabels,
    }),
  );

  const toolbar2dTools = $derived.by(
    () =>
      ({
        toggleCenterLines: {
          onPressedChange: (pressed) => (store.toggleCenterLines = pressed),
          pressed: store.toggleCenterLines,
          symbol: 'bounding-box',
          tooltip: 'Center lines',
          variant: 'toggle',
        },
        toggleDimensions: {
          onPressedChange: (pressed) => (store.toggleDimensions = pressed),
          pressed: store.toggleDimensions,
          symbol: 'diameter',
          tooltip: 'Dimensions',
          variant: 'toggle',
        },
        toggleHashes: {
          onPressedChange: (pressed) => (store.toggleHashes = pressed),
          pressed: store.toggleHashes,
          symbol: 'wireframe',
          tooltip: 'Section hatching',
          variant: 'toggle',
        },
        toggleHiddenLines: {
          onPressedChange: (pressed) => (store.toggleHiddenLines = pressed),
          pressed: store.toggleHiddenLines,
          symbol: 'shades-of-gray',
          tooltip: 'Hidden lines',
          variant: 'toggle',
        },
        toggleSourceLabels: {
          onPressedChange: (pressed) => (store.toggleSourceLabels = pressed),
          pressed: store.toggleSourceLabels,
          symbol: 'text-input',
          tooltip: 'Source labels',
          variant: 'toggle',
        },
      }) satisfies Record<Toolbar2dTools, ToggleTool>,
  );
</script>

{#snippet toolbarTool(tool: Toolbar3dTool)}
  <Tooltip.Root disableCloseOnTriggerClick={tool.variant === 'menu'}>
    <Tooltip.Trigger
      class="text-sepia-700 hover:bg-sepia-200 flex size-8 items-center justify-center p-1"
    >
      {#snippet child({ props })}
        {#if tool.variant === 'toggle'}
          <Toggle.Root
            {...props}
            class="text-sepia-700 hover:bg-sepia-200 data-disabled:text-sepia-500 data-[state=on]:bg-brand-800 data-[state=on]:text-sepia-000 flex size-8 cursor-pointer items-center justify-center p-1 data-disabled:cursor-not-allowed data-disabled:hover:bg-transparent"
            disabled={tool.disabled}
            onPressedChange={tool.onPressedChange}
            pressed={tool.pressed}
          >
            <span class="sr-only">{tool.tooltip}</span>

            {#if tool.disabled}
              <Sprite class="size-6 animate-spin" symbol="spinner" />
            {:else}
              <Sprite class="size-6" symbol={tool.symbol} />
            {/if}
          </Toggle.Root>
        {:else}
          <button
            {...props}
            class="text-sepia-700 hover:bg-sepia-200 disabled:text-sepia-500 flex size-8 items-center justify-center p-1 disabled:cursor-not-allowed disabled:hover:bg-transparent"
            disabled={tool.disabled}
            onclick={tool.variant === 'button' ? tool.onclick : undefined}
          >
            <span class="sr-only">{tool.tooltip}</span>

            {#if tool.disabled}
              <Sprite class="size-6 animate-spin" symbol="spinner" />
            {:else}
              <Sprite class="size-6" symbol={tool.symbol} />
            {/if}
          </button>
        {/if}
      {/snippet}
    </Tooltip.Trigger>

    <Tooltip.Portal>
      {#if tool.variant === 'menu' && !tool.disabled}
        <Tooltip.Content
          class="border-sepia-900 bg-sepia-000 z-50 grid border"
          side={tool.menu.side}
          sideOffset={8}
          style={`grid-template-columns: repeat(${tool.menu.columns}, minmax(0, 1fr))`}
        >
          <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
            {#each tool.menu.options as option (option.tooltip)}
              <Tooltip.Root>
                <Tooltip.Trigger>
                  {#snippet child({ props })}
                    {#if option.behavior === 'command'}
                      <button
                        {...props}
                        class="text-sepia-700 hover:bg-brand-800 hover:text-sepia-000 flex size-9 cursor-pointer items-center justify-center"
                        onclick={option.onclick}
                      >
                        <span class="sr-only">{option.tooltip}</span>
                        <Sprite class="size-6" symbol={option.symbol} />
                      </button>
                    {:else}
                      <Toggle.Root
                        {...props}
                        class="text-sepia-700 hover:bg-sepia-200 data-[state=on]:bg-brand-800 data-[state=on]:text-sepia-000 flex size-9 cursor-pointer items-center justify-center"
                        onPressedChange={() => option.onclick()}
                        pressed={option.pressed ?? false}
                      >
                        <span class="sr-only">{option.tooltip}</span>
                        <Sprite class="size-6" symbol={option.symbol} />
                      </Toggle.Root>
                    {/if}
                  {/snippet}
                </Tooltip.Trigger>

                <Tooltip.Portal>
                  <Tooltip.Content
                    class="border-sepia-900 bg-sepia-900 text-sepia-000 z-50 grid border px-1.5 py-px text-sm leading-[1.6]"
                    side={tool.menu.tooltipSide}
                    sideOffset={8}
                  >
                    {option.tooltip}
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            {/each}
          </Tooltip.Provider>
        </Tooltip.Content>
      {:else}
        <Tooltip.Content
          class="border-sepia-900 bg-sepia-900 text-sepia-000 z-50 grid border px-1.5 py-px text-sm leading-[1.6]"
          sideOffset={8}
        >
          {tool.tooltip}
        </Tooltip.Content>
      {/if}
    </Tooltip.Portal>
  </Tooltip.Root>
{/snippet}

<main class="relative h-dvh w-screen">
  <Tooltip.Provider delayDuration={0} skipDelayDuration={0}>
    <a
      class="text-brand-800 hover:text-sepia-800 absolute top-6 left-6 z-50 sm:left-8"
      href={resolve('/(app)/(private)')}
    >
      <Sprite class="h-5" symbol="dimsight-logo" viewBox="0 0 82 16" />
    </a>

    <div class="fixed inset-x-0 bottom-3 z-50 flex items-center justify-center">
      <div class="bg-sepia-000 flex h-12 overflow-x-scroll shadow-border drop-shadow">
        {#if viewMode === '2d'}
          <div class="border-alpha-200 flex gap-2 border-r p-2">
            <Select.Root
              items={drawingOptions}
              onValueChange={(v) => (store.drawingAngle = v ?? 'both')}
              type="single"
              value={store.drawingAngle}
            >
              <Select.Trigger
                aria-label="Select a preset"
                class="border-alpha-100 bg-sepia-100 hover:bg-sepia-000 h-8 cursor-pointer border px-2"
              >
                <Select.Value class="text-sm leading-[1.6]" />
              </Select.Trigger>

              <Select.Portal>
                <Select.Content
                  align="start"
                  class="border-sepia-900 bg-sepia-000 z-50 min-w-(--bits-floating-anchor-width) border outline-hidden select-none data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1"
                  side="top"
                >
                  {#each drawingOptions as drawing (drawing.value)}
                    <Select.Item
                      class="data-highlighted:bg-brand-800 data-highlighted:text-sepia-000 flex h-7 w-full shrink-0 items-center px-2 text-sm leading-[1.6] whitespace-nowrap"
                      label={drawing.label}
                      value={drawing.value}
                    >
                      {drawing.label}
                    </Select.Item>
                  {/each}
                </Select.Content>
              </Select.Portal>
            </Select.Root>
          </div>
        {/if}

        {#if viewMode === '3d' || has2dTools}
          <div class="flex gap-2 p-2">
            {#if viewMode === '2d'}
              {#if drawingCapabilities.center}
                {@render toolbarTool(toolbar2dTools.toggleCenterLines)}
              {/if}
              {#if drawingCapabilities.dimensions}
                {@render toolbarTool(toolbar2dTools.toggleDimensions)}
              {/if}
              {#if drawingCapabilities.section}
                {@render toolbarTool(toolbar2dTools.toggleHashes)}
              {/if}
              {#if drawingCapabilities.hidden}
                {@render toolbarTool(toolbar2dTools.toggleHiddenLines)}
              {/if}
              {#if drawingCapabilities.sourceLabels}
                {@render toolbarTool(toolbar2dTools.toggleSourceLabels)}
              {/if}
            {/if}

            {#if viewMode === '3d'}
              {@render toolbarTool(toolbar3dTools.resetAll)}
              {@render toolbarTool(toolbar3dTools.autoRotate)}
              {@render toolbarTool(toolbar3dTools.cameraAngles)}
              {@render toolbarTool(toolbar3dTools.visualStyles)}
              {@render toolbarTool(toolbar3dTools.boundingBox)}
              {@render toolbarTool(toolbar3dTools.measurementTools)}
              {@render toolbarTool(toolbar3dTools.cuttingPlanes)}

              <Popover.Root
                onOpenChange={(open) => (store.explosionOpen = open)}
                open={store.explosionOpen}
              >
                <Tooltip.Root>
                  <Tooltip.Trigger>
                    {#snippet child({ props })}
                      <Popover.Trigger
                        {...props}
                        class="text-sepia-700 hover:bg-sepia-200 flex size-8 items-center justify-center p-1"
                      >
                        <span class="sr-only">Exploded view</span>
                        <Sprite class="size-6" symbol="exploded-view" />
                      </Popover.Trigger>
                    {/snippet}
                  </Tooltip.Trigger>

                  <Tooltip.Portal>
                    <Tooltip.Content
                      class="border-sepia-900 bg-sepia-900 text-sepia-000 grid border px-1.5 py-px text-sm leading-[1.6]"
                      sideOffset={8}
                    >
                      Exploded view
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>

                <Popover.Portal>
                  <Popover.Content
                    class="border-sepia-900 bg-sepia-000 z-50 grid h-32 w-8 border"
                    sideOffset={8}
                  >
                    <Slider.Root
                      bind:value={store.explosion}
                      class="grid size-full"
                      max={1}
                      min={0}
                      onValueChange={(value) => viewer?.setExplosion(value)}
                      orientation="vertical"
                      step={0.01}
                      type="single"
                    >
                      <span class="bg-sepia-000 relative size-full grow cursor-pointer">
                        <Slider.Range class="bg-brand-800 absolute w-full" />
                      </span>
                      <Slider.Thumb
                        class="border-sepia-900 bg-sepia-000 h-4 w-full cursor-grab border outline-none active:cursor-grabbing"
                        index={0}
                      />
                    </Slider.Root>
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>

              {@render toolbarTool(toolbar3dTools.takeScreenshot)}
            {/if}
          </div>
        {/if}

        {#if drawingsReady}
          <div
            class={[
              'flex p-2',
              viewMode === '2d' && !has2dTools ? '' : 'border-sepia-400 border-l',
            ]}
          >
            <Tabs.Root bind:value={viewMode}>
              <Tabs.List class="bg-sepia-200 text-sepia-700 flex h-8 p-0.5">
                {#each UI_VIEW_MODES as mode (mode)}
                  <Tooltip.Root>
                    <Tooltip.Trigger disabled={mode === '2d' && !drawingReady}>
                      {#snippet child({ props })}
                        <Tabs.Trigger
                          {...props}
                          class="disabled:text-sepia-500 data-[state=active]:bg-sepia-000 data-[state=active]:text-brand-800 flex size-7 cursor-pointer items-center justify-center p-1 disabled:cursor-not-allowed data-[state=active]:shadow-border"
                          disabled={mode === '2d' && !drawingReady}
                          value={mode}
                        >
                          {#if mode === '2d' && !drawingReady}
                            <Sprite class="size-5 animate-spin" symbol="spinner" />
                          {:else}
                            <Sprite class="size-5" symbol={mode} />
                          {/if}
                        </Tabs.Trigger>
                      {/snippet}
                    </Tooltip.Trigger>

                    <Tooltip.Portal>
                      <Tooltip.Content
                        class="border-sepia-900 bg-sepia-900 text-sepia-000 z-50 grid border px-1.5 py-px text-sm leading-[1.6] uppercase"
                        sideOffset={10}
                      >
                        {mode}
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                {/each}
              </Tabs.List>
            </Tabs.Root>
          </div>
        {/if}
      </div>
    </div>
  </Tooltip.Provider>

  <ContextMenu.Root>
    <ContextMenu.Trigger class="contents">
      <div bind:this={config.root} class="relative size-full">
        <canvas
          bind:this={config.canvas}
          class="block size-full touch-none"
          oncontextmenu={(event) => {
            if (viewer?.selectPartAt(event.clientX, event.clientY)) return;
            event.stopPropagation();
          }}
        ></canvas>

        {#if viewMode === '3d' && file.glbUrl && (store.viewerStatus === 'empty' || store.viewerStatus === 'loading')}
          <div class="bg-sepia-000 absolute inset-0 z-30 flex items-center justify-center">
            <Sprite
              class="text-sepia-500 size-10 animate-spin transition-opacity delay-150 duration-0 starting:opacity-0"
              symbol="spinner"
            />
          </div>
        {/if}

        <div
          bind:this={drawingRoot}
          class={[
            'bg-sepia-000 absolute inset-0 z-40 flex items-start justify-center overflow-hidden px-6 pt-16 pb-20 sm:items-center sm:p-20',
            viewMode === '2d' ? ' visible' : ' invisible',
          ]}
          oncontextmenu={(event) => event.stopPropagation()}
          role="presentation"
        ></div>
      </div>
    </ContextMenu.Trigger>

    {#if viewMode === '3d'}
      <ContextMenu.Portal>
        <ContextMenu.Content
          class="border-sepia-900 bg-sepia-000 z-50 flex flex-col items-stretch border select-none"
        >
          <ContextMenu.Item
            class="group data-highlighted:bg-brand-800 data-highlighted:text-sepia-100 relative flex h-9 cursor-pointer items-center gap-2 px-2.5 text-sm leading-[1.6]"
            onclick={() => viewer?.isolateSelectedPart()}
          >
            Isolate
          </ContextMenu.Item>

          <ContextMenu.Item
            class="group data-highlighted:bg-brand-800 data-highlighted:text-sepia-100 relative flex h-9 cursor-pointer items-center gap-2 px-2.5 text-sm leading-[1.6]"
            onclick={() => viewer?.frameSelectedPart()}
          >
            Zoom
          </ContextMenu.Item>

          <ContextMenu.Item
            class="group data-highlighted:bg-brand-800 data-highlighted:text-sepia-100 relative flex h-9 cursor-pointer items-center gap-2 px-2.5 text-sm leading-[1.6]"
            onclick={() => viewer?.hideSelectedPart()}
          >
            Hide
          </ContextMenu.Item>

          <ContextMenu.Item
            class="group data-highlighted:bg-brand-800 data-highlighted:text-sepia-100 relative flex h-9 cursor-pointer items-center gap-2 px-2.5 text-sm leading-[1.6]"
            onclick={() => viewer?.makeSelectedPartTransparent()}
          >
            Transparent
          </ContextMenu.Item>

          <ContextMenu.Item
            class="group data-highlighted:bg-brand-800 data-highlighted:text-sepia-100 relative flex h-9 cursor-pointer items-center gap-2 px-2.5 text-sm leading-[1.6]"
            onclick={() => viewer?.restoreAllParts()}
          >
            Show all parts
          </ContextMenu.Item>
        </ContextMenu.Content>
      </ContextMenu.Portal>
    {/if}
  </ContextMenu.Root>
</main>
