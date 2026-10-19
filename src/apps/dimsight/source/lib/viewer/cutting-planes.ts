import * as THREE from 'three';

import type { CuttingPlaneState, UICuttingPlane } from './types';
import type { Viewport } from './viewport';

interface CuttingPlaneEntry {
  enabled: boolean;
  helper: RectangularPlaneHelper;
  initialConstant: number;
  maxOffset: number;
  normal: THREE.Vector3;
  offset: number;
  plane: THREE.Plane;
}

interface DragState {
  screenPerUnit: THREE.Vector2;
  startOffset: number;
  startPointer: THREE.Vector2;
  type: UICuttingPlane;
}

class RectangularPlaneHelper extends THREE.Object3D {
  readonly plane: THREE.Plane;
  private readonly fill: THREE.Mesh;
  private readonly fillMaterial: THREE.MeshBasicMaterial;
  private readonly line: THREE.LineLoop;
  private readonly lineMaterial: THREE.LineBasicMaterial;

  constructor(plane: THREE.Plane, width: number, height: number, color: number) {
    super();

    this.plane = plane;
    this.lineMaterial = new THREE.LineBasicMaterial({ color });
    this.fillMaterial = new THREE.MeshBasicMaterial({
      color,
      depthWrite: false,
      opacity: 0.12,
      side: THREE.DoubleSide,
      toneMapped: false,
      transparent: true,
    });
    this.line = new THREE.LineLoop(this.createRectangleGeometry(width, height), this.lineMaterial);
    this.fill = new THREE.Mesh(new THREE.PlaneGeometry(width, height), this.fillMaterial);

    this.lineMaterial.depthTest = false;
    this.lineMaterial.depthWrite = false;
    this.lineMaterial.opacity = 0.55;
    this.lineMaterial.transparent = true;
    this.line.renderOrder = 1;
    this.fill.renderOrder = 1;

    this.add(this.line, this.fill);
  }

  dispose(): void {
    this.line.geometry.dispose();
    this.lineMaterial.dispose();
    this.fill.geometry.dispose();
    this.fillMaterial.dispose();
  }

  setSize(width: number, height: number): void {
    this.line.geometry.dispose();
    this.line.geometry = this.createRectangleGeometry(width, height);

    this.fill.geometry.dispose();
    this.fill.geometry = new THREE.PlaneGeometry(width, height);
  }

  updateMatrixWorld(force?: boolean): void {
    this.position.set(0, 0, 0);
    this.lookAt(this.plane.normal);
    this.translateZ(-this.plane.constant);
    super.updateMatrixWorld(force);
  }

  private createRectangleGeometry(width: number, height: number): THREE.BufferGeometry {
    const halfWidth = width * 0.5;
    const halfHeight = height * 0.5;

    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-halfWidth, -halfHeight, 0),
      new THREE.Vector3(halfWidth, -halfHeight, 0),
      new THREE.Vector3(halfWidth, halfHeight, 0),
      new THREE.Vector3(-halfWidth, halfHeight, 0),
    ]);
  }
}

export class CuttingPlanes {
  private drag: DragState | null = null;
  private readonly entries = new Map<UICuttingPlane, CuttingPlaneEntry>();
  private readonly helperTypes = new Map<THREE.Object3D, UICuttingPlane>();

  constructor(
    private readonly viewport: Viewport,
    private readonly onChange: (planes: readonly THREE.Plane[]) => void,
  ) {
    const definitions: readonly [UICuttingPlane, THREE.Vector3][] = [
      ['top', new THREE.Vector3(0, -1, 0)],
      ['right', new THREE.Vector3(-1, 0, 0)],
      ['diagonal', new THREE.Vector3(-1, 0, -1).normalize()],
    ];

    for (const [type, normal] of definitions) {
      const plane = new THREE.Plane(normal.clone(), 0);
      const helper = new RectangularPlaneHelper(plane, 1, 1, 0xb34e32);

      helper.visible = false;
      helper.renderOrder = 10;

      helper.traverse((object) => {
        this.helperTypes.set(object, type);
      });

      this.entries.set(type, {
        enabled: false,
        helper,
        initialConstant: 0,
        maxOffset: 0,
        normal: normal.clone(),
        offset: 0,
        plane,
      });

      this.viewport.attach(helper);
    }
  }

  beginDrag(clientX: number, clientY: number): boolean {
    const activeEntries = [...this.entries.values()].filter((entry) => entry.enabled);

    if (activeEntries.length === 0) return false;

    const intersection = this.viewport
      .raycast(
        clientX,
        clientY,
        activeEntries.map((entry) => entry.helper),
      )
      .find((hit) => this.helperTypes.has(hit.object));

    if (!intersection) return false;

    const type = this.helperTypes.get(intersection.object);
    if (!type) return false;

    const entry = this.entries.get(type);
    if (!entry?.enabled) return false;

    const planePoint = entry.plane.coplanarPoint(new THREE.Vector3());
    const nextPoint = planePoint.clone().add(entry.normal);
    const startScreen = this.viewport.projectToScreen(planePoint);
    const nextScreen = this.viewport.projectToScreen(nextPoint);
    const screenPerUnit = new THREE.Vector2(
      nextScreen.x - startScreen.x,
      nextScreen.y - startScreen.y,
    );

    if (screenPerUnit.lengthSq() < 1e-6) return false;

    this.drag = {
      screenPerUnit,
      startOffset: entry.offset,
      startPointer: new THREE.Vector2(clientX, clientY),
      type,
    };

    return true;
  }

  dispose(): void {
    for (const entry of this.entries.values()) {
      this.viewport.detach(entry.helper);
      entry.helper.dispose();
    }

    this.entries.clear();
    this.helperTypes.clear();
    this.drag = null;
  }

  endDrag(): void {
    this.drag = null;
  }

  getActivePlanes(): THREE.Plane[] {
    return [...this.entries.values()].filter((entry) => entry.enabled).map((entry) => entry.plane);
  }

  getState(): CuttingPlaneState {
    return {
      diagonal: this.entries.get('diagonal')?.enabled ?? false,
      right: this.entries.get('right')?.enabled ?? false,
      top: this.entries.get('top')?.enabled ?? false,
    };
  }

  isDragging(): boolean {
    return this.drag !== null;
  }

  move(clientX: number, clientY: number): void {
    if (!this.drag) return;

    const entry = this.entries.get(this.drag.type);
    if (!entry) return;

    const pointerDelta = new THREE.Vector2(clientX, clientY).sub(this.drag.startPointer);
    const movement = pointerDelta.dot(this.drag.screenPerUnit) / this.drag.screenPerUnit.lengthSq();
    const offset = THREE.MathUtils.clamp(this.drag.startOffset + movement, 0, entry.maxOffset);

    if (offset === entry.offset) return;

    entry.offset = offset;
    entry.plane.constant = entry.initialConstant - offset;
    entry.helper.updateMatrixWorld(true);

    this.onChange(this.getActivePlanes());
  }

  reset(): void {
    this.drag = null;

    for (const entry of this.entries.values()) {
      entry.enabled = false;
      entry.offset = 0;
      entry.plane.constant = entry.initialConstant;
      entry.helper.visible = false;
      entry.helper.updateMatrixWorld(true);
    }

    this.onChange([]);
  }

  setBounds(bounds: THREE.Box3): void {
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const halfSize = size.clone().multiplyScalar(0.5);

    for (const entry of this.entries.values()) {
      const absoluteNormal = new THREE.Vector3(
        Math.abs(entry.normal.x),
        Math.abs(entry.normal.y),
        Math.abs(entry.normal.z),
      );

      const minimumProjection = entry.normal.dot(center) - absoluteNormal.dot(halfSize);

      entry.initialConstant = -minimumProjection;
      entry.maxOffset = Math.max(absoluteNormal.dot(size), 0.01);
      entry.offset = THREE.MathUtils.clamp(entry.offset, 0, entry.maxOffset);
      entry.plane.constant = entry.initialConstant - entry.offset;
      const helperSize = this.getHelperSize(size, entry.normal);
      entry.helper.setSize(helperSize.width, helperSize.height);
      entry.helper.updateMatrixWorld(true);
    }

    this.onChange(this.getActivePlanes());
  }

  toggle(type: UICuttingPlane): void {
    const entry = this.entries.get(type);
    if (!entry) return;

    entry.enabled = !entry.enabled;
    entry.helper.visible = entry.enabled;
    entry.helper.updateMatrixWorld(true);

    this.onChange(this.getActivePlanes());
  }

  private getHelperSize(
    size: THREE.Vector3,
    normal: THREE.Vector3,
  ): { height: number; width: number } {
    const tangent = new THREE.Vector3();

    if (Math.abs(normal.y) < 0.9) {
      tangent.crossVectors(new THREE.Vector3(0, 1, 0), normal).normalize();
    } else {
      tangent.crossVectors(new THREE.Vector3(1, 0, 0), normal).normalize();
    }

    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
    const tangentSize =
      Math.abs(tangent.x) * size.x + Math.abs(tangent.y) * size.y + Math.abs(tangent.z) * size.z;
    const bitangentSize =
      Math.abs(bitangent.x) * size.x +
      Math.abs(bitangent.y) * size.y +
      Math.abs(bitangent.z) * size.z;

    return {
      height: Math.max(bitangentSize * 1.02, 0.1),
      width: Math.max(tangentSize * 1.02, 0.1),
    };
  }
}
