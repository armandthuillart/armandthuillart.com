import * as THREE from 'three';

import type { PartSelectionOptions } from './types';
import type { Viewport } from './viewport';
import type { Visualization } from './visualization';

export class PartSelection {
  private readonly originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();

  private selectedPartId: string | null = null;

  constructor(
    private readonly viewport: Viewport,
    private readonly visualization: Visualization,
    private readonly options: PartSelectionOptions = {},
  ) {}

  clear(): void {
    if (!this.selectedPartId && this.originalMaterials.size === 0) return;

    this.clearHighlight();
    this.selectedPartId = null;
    this.options.onChange?.(null);
    this.viewport.requestRender();
  }

  dispose(): void {
    this.clearHighlight();
    this.selectedPartId = null;
  }

  frame(): void {
    const partId = this.selectedPartId;
    if (!partId) return;

    const bounds = new THREE.Box3();

    for (const object of this.visualization.getPartObjects(partId) ?? []) {
      bounds.expandByObject(object);
    }

    if (!bounds.isEmpty()) {
      this.viewport.frameBounds(bounds, true);
    }
  }

  getSelectedPartId(): string | null {
    return this.selectedPartId;
  }

  hide(): void {
    const partId = this.selectedPartId;
    if (!partId) return;

    this.clear();
    this.visualization.hidePart(partId);

    const visibleBounds = this.visualization.getVisibleBounds();

    if (!visibleBounds.isEmpty()) {
      this.viewport.frameBounds(visibleBounds, true);
    }
  }

  isolate(): void {
    const partId = this.selectedPartId;
    if (!partId) return;

    this.visualization.isolatePart(partId);
    this.frame();
  }

  makeTransparent(): void {
    const partId = this.selectedPartId;
    if (!partId) return;

    this.clear();
    this.visualization.makePartTransparent(partId);
  }

  restoreAll(transition = true): void {
    this.visualization.restoreAllParts();

    const bounds = this.visualization.getBounds();

    if (!bounds.isEmpty()) {
      this.viewport.resetBounds(bounds, transition);
    }
  }

  select(partId: string): void {
    if (partId === this.selectedPartId) return;
    if (!this.visualization.getPartObjects(partId)) return;

    this.clearHighlight();
    this.selectedPartId = partId;

    for (const mesh of this.visualization.getPartMeshes(partId)) {
      if (this.originalMaterials.has(mesh)) continue;

      this.originalMaterials.set(mesh, mesh.material);

      const highlightedMaterials = (
        Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      ).map((material) => {
        const highlighted = material.clone();

        if ('color' in highlighted) {
          const coloredMaterial = highlighted as THREE.Material & { color: THREE.Color };
          coloredMaterial.color.set(0x4340ff);
        }

        if ('emissive' in highlighted) {
          const emissiveMaterial = highlighted as THREE.Material & { emissive: THREE.Color };
          emissiveMaterial.emissive.set(0x1b197d);
        }

        return highlighted;
      });

      mesh.material = Array.isArray(mesh.material) ? highlightedMaterials : highlightedMaterials[0];
    }

    this.options.onChange?.(partId);
    this.viewport.requestRender();
  }

  selectAt(clientX: number, clientY: number): boolean {
    const intersections = this.viewport.raycast(
      clientX,
      clientY,
      this.visualization.getPickableObjects(),
    );

    for (const intersection of intersections) {
      if (
        !(intersection.object instanceof THREE.Mesh) ||
        !this.isObjectVisible(intersection.object)
      ) {
        continue;
      }

      const partId = this.visualization.findPartId(intersection.object);

      if (!partId || !this.visualization.isPartVisible(partId)) {
        continue;
      }

      this.select(partId);
      return true;
    }

    this.clear();
    return false;
  }

  private clearHighlight(): void {
    for (const [mesh, originalMaterial] of this.originalMaterials) {
      for (const highlightedMaterial of Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material]) {
        highlightedMaterial.dispose();
      }

      mesh.material = originalMaterial;
    }

    this.originalMaterials.clear();
  }

  private isObjectVisible(object: THREE.Object3D): boolean {
    let current: null | THREE.Object3D = object;

    while (current) {
      if (!current.visible) return false;
      current = current.parent;
    }

    return true;
  }
}
