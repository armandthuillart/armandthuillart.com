import { manifestBodySchema } from '../../native/contract.ts';
import type { EdgeBinding, FaceBinding } from '../../native/contract.ts';
import {
  DEFAULT_UI_VISUAL_STYLE,
  UI_CAMERA_ANGLES,
  UI_MEASUREMENT_TOOLS,
  UI_VISUAL_STYLES,
} from './constants';
import { CuttingPlanes } from './cutting-planes';
import { Measurements } from './measurements';
import { PartSelection } from './part-selection';
import { SceneOverlays } from './scene-overlays';
import type {
  ParsedManifest,
  PointerStart,
  UICameraAngle,
  UICuttingPlane,
  UIVisualStyle,
  ViewerOptions,
  ViewerState,
  ViewerSubscriber,
  UIMeasurementTool,
  VisualizationSource,
} from './types';
import { Viewport } from './viewport';
import { Visualization } from './visualization';

export class Viewer {
  static readonly cameraAngles = UI_CAMERA_ANGLES;
  static readonly measurementTools = UI_MEASUREMENT_TOOLS;
  static readonly visualStyles = UI_VISUAL_STYLES;

  private readonly cuttingPlanes: CuttingPlanes;
  private disposed = false;
  private loadId = 0;
  private readonly measurements: Measurements;
  private readonly overlays: SceneOverlays;
  private readonly partSelection: PartSelection;
  private pendingPointerMove: { buttons: number; x: number; y: number } | null = null;

  private pointerMoveFrame: number | null = null;

  private pointerStart: PointerStart | null = null;
  private state: ViewerState = {
    activeTool: null,
    autoRotationEnabled: false,
    boundingBoxVisible: false,
    cameraAngle: 'isometric',
    cuttingPlanes: {
      diagonal: false,
      right: false,
      top: false,
    },
    error: null,
    explosion: 0,
    selectedPartId: null,
    status: 'empty',
    visualStyle: DEFAULT_UI_VISUAL_STYLE,
  };
  private readonly subscribers = new Set<ViewerSubscriber>();
  private readonly viewport: Viewport;
  private readonly visualization: Visualization;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly options: ViewerOptions,
  ) {
    this.viewport = new Viewport(canvas, {
      bottomInset: options.bottomInset,
    });

    this.visualization = new Visualization(this.viewport);
    this.overlays = new SceneOverlays(this.viewport);
    this.cuttingPlanes = new CuttingPlanes(this.viewport, (planes) => {
      this.visualization.setClippingPlanes(planes);
    });

    this.partSelection = new PartSelection(this.viewport, this.visualization, {
      onChange: (selectedPartId) => {
        this.updateState({ selectedPartId });
      },
    });

    this.measurements = new Measurements(this.viewport, this.visualization, this.overlays);

    canvas.addEventListener('pointerdown', this.handlePointerDown);
    canvas.addEventListener('pointerleave', this.handlePointerLeave);
    canvas.addEventListener('pointermove', this.handlePointerMove);
    canvas.addEventListener('pointerup', this.handlePointerUp);
    canvas.addEventListener('pointercancel', this.handlePointerCancel);
    window.addEventListener('keydown', this.handleTemporaryUpKey);
  }

  async attachManifest(url: string): Promise<void> {
    const manifest = await this.loadManifest(url);
    if (!manifest || this.disposed) return;

    this.visualization.setFaceBindings(manifest.faces);
    this.visualization.setEdgeBindings(manifest.edges);
    this.measurements.refreshCandidates();

    if (manifest.bounds) {
      this.visualization.setBounds(manifest.bounds);
    }

    this.updateCuttingPlaneBounds();

    if (this.state.boundingBoxVisible) {
      const bounds = this.visualization.getExactBounds();
      if (bounds) this.overlays.showBoundingBox(bounds);
    }
  }

  captureScreenshot(): Promise<Blob> {
    return this.viewport.captureScreenshot();
  }

  dispose(): void {
    if (this.disposed) return;

    this.disposed = true;
    this.loadId++;

    window.removeEventListener('keydown', this.handleTemporaryUpKey);
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);

    this.canvas.removeEventListener('pointerleave', this.handlePointerLeave);

    this.canvas.removeEventListener('pointermove', this.handlePointerMove);

    this.canvas.removeEventListener('pointerup', this.handlePointerUp);

    this.canvas.removeEventListener('pointercancel', this.handlePointerCancel);

    this.measurements.dispose();
    this.partSelection.dispose();
    this.cuttingPlanes.dispose();
    this.overlays.dispose();
    this.visualization.dispose();
    this.viewport.dispose();

    this.subscribers.clear();
    this.pointerStart = null;
    this.pendingPointerMove = null;

    if (this.pointerMoveFrame !== null) {
      cancelAnimationFrame(this.pointerMoveFrame);
      this.pointerMoveFrame = null;
    }
  }

  frameSelectedPart(): void {
    this.partSelection.frame();
  }

  hideSelectedPart(): void {
    this.partSelection.hide();
  }

  isolateSelectedPart(): void {
    this.partSelection.isolate();
  }

  async load(source: VisualizationSource): Promise<void> {
    const loadId = ++this.loadId;

    this.cuttingPlanes.reset();
    this.partSelection.clear();
    this.measurements.clear();
    this.overlays.hideBoundingBox();

    this.updateState({
      cuttingPlanes: this.cuttingPlanes.getState(),
      error: null,
      selectedPartId: null,
      status: 'loading',
    });

    const manifest = this.loadManifest(source.manifestUrl);

    try {
      await this.visualization.load(source);

      if (loadId !== this.loadId || this.disposed) return;

      this.updateCuttingPlaneBounds();
      const parsedManifest = await manifest;

      if (loadId !== this.loadId || this.disposed) return;

      if (parsedManifest) {
        this.visualization.setFaceBindings(parsedManifest.faces);

        this.visualization.setEdgeBindings(parsedManifest.edges);
        this.measurements.refreshCandidates();

        if (parsedManifest.bounds) {
          this.visualization.setBounds(parsedManifest.bounds);
        }
      }

      this.updateCuttingPlaneBounds();

      if (this.state.boundingBoxVisible) {
        const bounds = this.visualization.getExactBounds();

        if (bounds) {
          this.overlays.showBoundingBox(bounds);
        }
      }

      this.updateState({
        error: null,
        status: 'ready',
      });
    } catch (error) {
      if (loadId !== this.loadId || this.disposed) return;

      this.updateState({
        error: error instanceof Error ? error : new Error('Could not load visualization'),
        status: 'failed',
      });
    }
  }

  makeSelectedPartTransparent(): void {
    this.partSelection.makeTransparent();
  }

  reset(): void {
    this.cuttingPlanes.reset();
    this.partSelection.clear();
    this.partSelection.restoreAll(false);
    this.measurements.setTool(null);
    this.overlays.hideBoundingBox();

    this.visualization.setExplosion(0);
    this.visualization.setVisualStyle(DEFAULT_UI_VISUAL_STYLE);

    this.viewport.setAutoRotation(false);

    this.canvas.style.cursor = '';

    this.updateState({
      activeTool: null,
      autoRotationEnabled: false,
      boundingBoxVisible: false,
      cameraAngle: 'isometric',
      cuttingPlanes: this.cuttingPlanes.getState(),
      explosion: 0,
      selectedPartId: null,
      visualStyle: DEFAULT_UI_VISUAL_STYLE,
    });
  }

  resize(width?: number, height?: number): void {
    this.viewport.resize(width, height);
  }

  restoreAllParts(): void {
    this.partSelection.restoreAll();
  }

  selectPartAt(clientX: number, clientY: number): boolean {
    if (this.state.activeTool) return false;

    return this.partSelection.selectAt(clientX, clientY);
  }

  setCameraAngle(cameraAngle: UICameraAngle): void {
    this.viewport.setAutoRotation(false);
    this.viewport.setCameraAngle(cameraAngle);

    this.updateState({
      autoRotationEnabled: false,
      cameraAngle,
    });
  }

  setExplosion(explosion: number): void {
    explosion = Math.min(Math.max(explosion, 0), 1);
    if (explosion === this.state.explosion) return;
    this.visualization.setExplosion(explosion);

    if (this.state.boundingBoxVisible) {
      const bounds = this.visualization.getExactBounds();
      if (bounds) this.overlays.showBoundingBox(bounds);
    }

    this.updateState({ explosion });
  }

  setPaused(paused: boolean): void {
    this.viewport.setPaused(paused);
  }

  setVisualStyle(visualStyle: UIVisualStyle): void {
    if (visualStyle === this.state.visualStyle) return;

    this.partSelection.clear();
    this.visualization.setVisualStyle(visualStyle);

    this.updateState({
      selectedPartId: null,
      visualStyle,
    });
  }

  subscribe(subscriber: ViewerSubscriber): () => void {
    subscriber(this.state);
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  toggleAutoRotation(): void {
    const enabled = !this.state.autoRotationEnabled;
    this.viewport.setAutoRotation(enabled);
    this.updateState({ autoRotationEnabled: enabled });
  }

  toggleBoundingBox(): void {
    const visible = !this.state.boundingBoxVisible;

    if (visible) {
      const bounds = this.visualization.getExactBounds();

      if (bounds) {
        this.overlays.showBoundingBox(bounds);
      }
    } else {
      this.overlays.hideBoundingBox();
    }

    this.updateState({ boundingBoxVisible: visible });
  }

  toggleCuttingPlane(type: UICuttingPlane): void {
    this.cuttingPlanes.toggle(type);
    this.updateState({ cuttingPlanes: this.cuttingPlanes.getState() });
  }

  toggleTool(tool: UIMeasurementTool): void {
    const activeTool = this.state.activeTool === tool ? null : tool;

    this.partSelection.clear();
    this.measurements.setTool(activeTool);
    this.canvas.style.cursor = activeTool ? 'pointer' : '';

    this.updateState({
      activeTool,
      selectedPartId: null,
    });
  }

  private endCuttingPlaneDrag(): void {
    this.cuttingPlanes.endDrag();
    this.viewport.setControlsEnabled(true);
    this.canvas.style.cursor = this.state.activeTool ? 'pointer' : '';
  }

  private handlePointerCancel = (): void => {
    if (!this.cuttingPlanes.isDragging()) return;

    this.endCuttingPlaneDrag();
  };

  private handlePointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;

    if (event.metaKey && event.pointerType !== 'touch') {
      this.pointerStart = null;
      return;
    }

    if (this.cuttingPlanes.beginDrag(event.clientX, event.clientY)) {
      this.pointerStart = null;
      this.viewport.setControlsEnabled(false);
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    this.pointerStart = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
  };

  private handlePointerLeave = (): void => {
    if (this.cuttingPlanes.isDragging()) return;

    this.pointerStart = null;
    this.measurements.handlePointerLeave();
  };

  private handlePointerMove = (event: PointerEvent): void => {
    if (this.cuttingPlanes.isDragging()) {
      this.cuttingPlanes.move(event.clientX, event.clientY);
      return;
    }

    this.schedulePointerMove(event.clientX, event.clientY, event.buttons);
  };

  private handlePointerUp = (event: PointerEvent): void => {
    if (this.cuttingPlanes.isDragging()) {
      this.endCuttingPlaneDrag();
      return;
    }

    const pointerStart = this.pointerStart;
    this.pointerStart = null;

    if (
      !pointerStart ||
      pointerStart.id !== event.pointerId ||
      Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y) > 4
    ) {
      return;
    }

    if (this.state.activeTool) {
      this.measurements.handleClick(event.clientX, event.clientY);
      return;
    }

    const selected = this.partSelection.selectAt(event.clientX, event.clientY);

    if (selected && event.pointerType === 'touch') {
      this.options.onPartMenuRequested?.({
        x: event.clientX,
        y: event.clientY,
      });
    }
  };

  private handleTemporaryUpKey = (event: KeyboardEvent): void => {
    if (!event.altKey || event.metaKey || event.ctrlKey) return;

    const axis = { KeyX: 'x', KeyY: 'y', KeyZ: 'z' }[event.code];
    if (!axis) return;

    event.preventDefault();
    this.viewport.setAutoRotation(false);
    this.viewport.rotateFrame(axis as 'x' | 'y' | 'z', event.shiftKey ? 90 : -90);
  };

  private async loadManifest(url: string | null | undefined): Promise<ParsedManifest | null> {
    if (!url) return null;

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Could not load visualization manifest');
      }

      const { entities } = manifestBodySchema.parse(await response.json());
      const min: [number, number, number] = [Infinity, Infinity, Infinity];
      const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
      const faces: FaceBinding[] = [];
      const edges: EdgeBinding[] = [];

      for (const entity of entities) {
        if (entity.kind === 'occurrence') {
          for (const axis of [0, 1, 2] as const) {
            min[axis] = Math.min(min[axis], entity.bounds.min[axis]);
            max[axis] = Math.max(max[axis], entity.bounds.max[axis]);
          }

          continue;
        }

        if (entity.kind === 'face') {
          if (entity.primitiveIndex === undefined) continue;

          faces.push({
            diameter: entity.diameter,
            entityId: entity.entityId,
            occurrenceId: entity.occurrenceId,
            plane: entity.plane,
            primitiveIndex: entity.primitiveIndex,
            surfaceKind: entity.surfaceKind,
          });

          continue;
        }

        if (!entity.endpoints) continue;

        edges.push({
          curveKind: entity.curveKind,
          endpoints: entity.endpoints,
          entityId: entity.entityId,
          occurrenceId: entity.occurrenceId,
        });
      }

      const bounds = min.every(Number.isFinite) && max.every(Number.isFinite) ? { max, min } : null;

      return { bounds, edges, faces };
    } catch {
      return null;
    }
  }

  private schedulePointerMove(x: number, y: number, buttons: number): void {
    this.pendingPointerMove = { buttons, x, y };
    if (this.pointerMoveFrame !== null) return;

    this.pointerMoveFrame = requestAnimationFrame(() => {
      this.pointerMoveFrame = null;
      const pointer = this.pendingPointerMove;
      this.pendingPointerMove = null;

      if (pointer) {
        this.measurements.handlePointerMove(pointer.x, pointer.y, pointer.buttons);
      }
    });
  }

  private updateCuttingPlaneBounds(): void {
    this.cuttingPlanes.setBounds(
      this.visualization.getExactBounds() ?? this.visualization.getBounds(),
    );
  }

  private updateState(update: Partial<ViewerState>): void {
    this.state = {
      ...this.state,
      ...update,
    };

    for (const subscriber of this.subscribers) {
      subscriber(this.state);
    }
  }
}
