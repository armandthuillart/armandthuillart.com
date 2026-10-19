import * as THREE from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';

import type { AngleOverlay, DistanceOverlay, FaceReference } from './types';
import type { Viewport } from './viewport';

const DIMENSION_LABEL_MIN_HEIGHT_PX = 40;

export class SceneOverlays {
  private boundingBox: THREE.Group | null = null;

  private readonly candidateFaceOverlays = new Map<
    string,
    { mesh: THREE.Mesh; source: THREE.Mesh }
  >();
  private readonly faceOverlays = new Set<{
    mesh: THREE.Mesh;
    source: THREE.Mesh;
  }>();
  private facePreview: { key: string; overlay: { mesh: THREE.Mesh; source: THREE.Mesh } } | null =
    null;
  private measurement: THREE.Group | null = null;

  private pointPreview: THREE.Mesh | null = null;
  private readonly selectedFaceOverlays = new Map<
    string,
    { mesh: THREE.Mesh; source: THREE.Mesh }
  >();

  private unsubscribeBeforeRender: (() => void) | null = null;

  constructor(private readonly viewport: Viewport) {
    this.unsubscribeBeforeRender = viewport.subscribeBeforeRender(() => {
      this.update();
    });
  }

  clearCandidateFaces(): void {
    for (const overlay of new Set(this.candidateFaceOverlays.values())) {
      this.disposeFaceOverlay(overlay);
    }

    this.candidateFaceOverlays.clear();
    this.viewport.requestRender();
  }

  clearFacePreview(): void {
    if (!this.facePreview) return;

    this.disposeFaceOverlay(this.facePreview.overlay);
    this.facePreview = null;
    this.viewport.requestRender();
  }

  clearInteraction(): void {
    this.clearFacePreview();
    this.clearSelectedFace();
    this.clearCandidateFaces();
    this.clearPointPreview();
  }

  clearMeasurement(): void {
    if (!this.measurement) return;

    this.disposeGroup(this.measurement);
    this.viewport.detach(this.measurement);
    this.measurement = null;
  }

  clearPointPreview(): void {
    if (!this.pointPreview?.visible) return;

    this.pointPreview.visible = false;
    this.viewport.requestRender();
  }

  clearSelectedFace(): void {
    for (const overlay of new Set(this.selectedFaceOverlays.values())) {
      this.disposeFaceOverlay(overlay);
    }

    this.selectedFaceOverlays.clear();
    this.viewport.requestRender();
  }

  dispose(): void {
    this.unsubscribeBeforeRender?.();
    this.unsubscribeBeforeRender = null;

    this.clearInteraction();
    this.clearMeasurement();
    this.hideBoundingBox();

    for (const overlay of this.faceOverlays) {
      this.disposeFaceOverlay(overlay);
    }

    if (this.pointPreview) {
      this.pointPreview.geometry.dispose();
      for (const material of Array.isArray(this.pointPreview.material)
        ? this.pointPreview.material
        : [this.pointPreview.material]) {
        material.dispose();
      }
      this.viewport.detach(this.pointPreview);
      this.pointPreview = null;
    }
  }

  hideBoundingBox(): void {
    if (!this.boundingBox) return;

    this.disposeGroup(this.boundingBox);
    this.viewport.detach(this.boundingBox);
    this.boundingBox = null;
  }

  selectFace(face: FaceReference): void {
    const key = face.binding.entityId;
    if (this.selectedFaceOverlays.has(key)) return;

    const overlay = this.createFaceOverlay([face], false);
    if (!overlay) return;

    this.selectedFaceOverlays.set(key, overlay);

    this.viewport.requestRender();
  }

  showAngle({ angleDegrees, directionA, directionB, origin, radius }: AngleOverlay): void {
    this.clearMeasurement();

    const firstDirection = directionA.clone().normalize();
    const secondDirection = directionB.clone().normalize();
    const length = radius * 0.2;
    const arcRadius = length * 0.65;

    const firstEnd = origin.clone().addScaledVector(firstDirection, length);

    const secondEnd = origin.clone().addScaledVector(secondDirection, length);

    const group = new THREE.Group();
    group.name = 'angle-measurement';

    group.add(
      this.createLine([origin, firstEnd], 'measurement-angle-ray', 0x4340ff, {
        depthWrite: false,
      }),
      this.createLine([origin, secondEnd], 'measurement-angle-ray', 0x4340ff, {
        depthWrite: false,
      }),
    );

    const axis = new THREE.Vector3().crossVectors(firstDirection, secondDirection).normalize();
    const radians = Math.acos(THREE.MathUtils.clamp(firstDirection.dot(secondDirection), -1, 1));
    const arcPoints: THREE.Vector3[] = [];
    const steps = 32;

    for (let index = 0; index <= steps; index++) {
      arcPoints.push(
        firstDirection
          .clone()
          .applyAxisAngle(axis, (radians * index) / steps)
          .multiplyScalar(arcRadius)
          .add(origin),
      );
    }

    group.add(
      this.createLine(arcPoints, 'measurement-angle-arc', 0x4340ff, {
        depthWrite: false,
      }),
    );

    const labelPosition = firstDirection
      .clone()
      .applyAxisAngle(axis, radians / 2)
      .multiplyScalar(length)
      .add(origin);

    const label = this.createLabel(`${angleDegrees.toFixed(2)}°`, '#4340ff');

    label.name = 'measurement-label';
    label.position.copy(labelPosition);
    group.add(label);

    this.measurement = group;
    this.viewport.attach(group);
  }

  showBoundingBox(bounds: THREE.Box3): void {
    this.hideBoundingBox();

    if (bounds.isEmpty()) return;

    const box = bounds.clone();
    const dimensions = box.getSize(new THREE.Vector3());
    const modelSize = Math.max(dimensions.length(), Number.EPSILON);
    const offset = modelSize * 0.08;
    const labelHeight = Math.max(
      modelSize * 0.04,
      this.viewport.worldHeightForPixels(DIMENSION_LABEL_MIN_HEIGHT_PX),
    );

    const outline = new THREE.Box3Helper(box, 0x4340ff);
    outline.name = 'bounding-box-outline';
    outline.renderOrder = 3;

    for (const material of Array.isArray(outline.material)
      ? outline.material
      : [outline.material]) {
      material.depthTest = false;
      material.toneMapped = false;
    }

    const group = new THREE.Group();
    group.name = 'bounding-box';
    group.add(outline);

    const labels = [
      {
        position: new THREE.Vector3((box.min.x + box.max.x) / 2, box.min.y - offset, box.min.z),
        text: `W ${(dimensions.x * 1000).toFixed(2)} mm`,
      },
      {
        position: new THREE.Vector3(box.min.x - offset, (box.min.y + box.max.y) / 2, box.min.z),
        text: `H ${(dimensions.y * 1000).toFixed(2)} mm`,
      },
      {
        position: new THREE.Vector3(
          box.min.x - offset,
          box.min.y - offset,
          (box.min.z + box.max.z) / 2,
        ),
        text: `D ${(dimensions.z * 1000).toFixed(2)} mm`,
      },
    ];

    for (const { position, text } of labels) {
      const label = this.createLabel(text, '#4340ff');
      label.position.copy(position);
      label.scale.set(labelHeight * (512 / 96), labelHeight, 1);
      group.add(label);
    }

    this.boundingBox = group;
    this.viewport.attach(group);
  }

  showCandidateFaces(faces: readonly FaceReference[]): void {
    this.clearCandidateFaces();

    const grouped = new Map<THREE.Mesh, Map<string, FaceReference>>();

    for (const face of faces) {
      const references = grouped.get(face.mesh) ?? new Map<string, FaceReference>();
      references.set(face.binding.entityId, face);
      grouped.set(face.mesh, references);
    }

    for (const references of grouped.values()) {
      const overlay = this.createFaceOverlay([...references.values()], true);
      if (!overlay) continue;

      for (const face of references.values()) {
        this.candidateFaceOverlays.set(face.binding.entityId, overlay);
      }
    }

    this.viewport.requestRender();
  }

  showDistance({ distanceMm, from, showPoints = true, to }: DistanceOverlay): void {
    this.clearMeasurement();

    const group = new THREE.Group();
    group.name = 'distance-measurement';

    const line = this.createLine([from, to], 'measurement-line', 0x4340ff);

    const label = this.createLabel(`${distanceMm.toFixed(2)} mm`, '#4340ff');

    label.name = 'measurement-label';
    label.position.copy(from).add(to).multiplyScalar(0.5);

    group.add(line, label);

    if (showPoints) {
      const pointGeometry = new THREE.SphereGeometry(1, 16, 8);
      const pointMaterial = new THREE.MeshBasicMaterial({
        color: 0x4340ff,
        depthTest: false,
        toneMapped: false,
      });

      const start = new THREE.Mesh(pointGeometry, pointMaterial);
      start.name = 'measurement-start';
      start.position.copy(from);
      start.renderOrder = 5;

      const end = new THREE.Mesh(pointGeometry, pointMaterial);
      end.name = 'measurement-end';
      end.position.copy(to);
      end.renderOrder = 5;

      group.add(start, end);
    }

    this.measurement = group;
    this.viewport.attach(group);
  }

  showFacePreview(face: FaceReference): void {
    const key = face.binding.entityId;
    if (this.facePreview?.key === key) return;

    this.clearFacePreview();

    const overlay = this.createFaceOverlay([face], false);
    if (!overlay) return;

    this.facePreview = { key, overlay };

    this.viewport.requestRender();
  }

  showPendingPoint(position: THREE.Vector3): void {
    if (!this.measurement) return;

    this.measurement.add(this.createMeasurementPoint(position, 'measurement-end'));
    this.viewport.requestRender();
  }

  showPointPreview(position: THREE.Vector3): void {
    if (!this.pointPreview) {
      this.pointPreview = new THREE.Mesh(
        new THREE.SphereGeometry(1, 16, 16),
        new THREE.MeshBasicMaterial({
          color: 0x000000,
          depthTest: false,
          toneMapped: false,
        }),
      );
      this.pointPreview.name = 'measurement-point-preview';
      this.pointPreview.renderOrder = 5;
      this.viewport.attach(this.pointPreview);
    }

    this.pointPreview.position.copy(position);
    this.pointPreview.visible = true;
    this.viewport.requestRender();
  }

  showSelectedPoint(position: THREE.Vector3): void {
    this.clearMeasurement();

    const group = new THREE.Group();
    group.name = 'point-to-point-pick';
    group.add(this.createMeasurementPoint(position, 'measurement-start'));

    this.measurement = group;
    this.viewport.attach(group);
  }

  private createFaceHighlightMaterials(
    material: THREE.Material | THREE.Material[],
    candidate: boolean,
  ): THREE.Material | THREE.Material[] {
    const highlighted = (Array.isArray(material) ? material : [material]).map((original) => {
      const clone = original.clone();

      if ('color' in clone && clone.color instanceof THREE.Color) {
        if (candidate) clone.color.lerp(new THREE.Color(0xffa52f), 0.25);
        else clone.color.set(0xff8a00);
      }

      if ('emissive' in clone && clone.emissive instanceof THREE.Color) {
        clone.emissive.set(candidate ? 0x291400 : 0x5c2600);
      }

      return clone;
    });

    return Array.isArray(material) ? highlighted : highlighted[0];
  }

  private createFaceOverlay(
    faces: readonly FaceReference[],
    candidate: boolean,
  ): { mesh: THREE.Mesh; source: THREE.Mesh } | null {
    const source = faces[0]?.mesh;
    if (!source?.parent) return null;

    const sourceIndex = source.geometry.getIndex();
    const sourcePosition = source.geometry.getAttribute('position');
    if (!sourcePosition) return null;

    const sourceIndexCount = sourceIndex?.count ?? sourcePosition.count;
    const vertexIndexes: number[] = [];
    const overlayIndexes: number[] = [];
    const vertexMap = new Map<number, number>();

    for (const face of faces) {
      if (face.mesh !== source) return null;

      const start = face.triangleStart * 3;
      const end = start + face.triangleCount * 3;
      if (start < 0 || end > sourceIndexCount) return null;

      for (let index = start; index < end; index++) {
        const sourceVertexIndex = sourceIndex?.getX(index) ?? index;
        let overlayVertexIndex = vertexMap.get(sourceVertexIndex);

        if (overlayVertexIndex === undefined) {
          overlayVertexIndex = vertexIndexes.length;
          vertexIndexes.push(sourceVertexIndex);
          vertexMap.set(sourceVertexIndex, overlayVertexIndex);
        }

        overlayIndexes.push(overlayVertexIndex);
      }
    }

    if (overlayIndexes.length === 0) return null;

    const geometry = new THREE.BufferGeometry();

    for (const name of Object.keys(source.geometry.attributes)) {
      const attribute = source.geometry.getAttribute(name);
      const values = new Float32Array(vertexIndexes.length * attribute.itemSize);

      for (let vertexIndex = 0; vertexIndex < vertexIndexes.length; vertexIndex++) {
        const sourceVertexIndex = vertexIndexes[vertexIndex];

        for (let component = 0; component < attribute.itemSize; component++) {
          values[vertexIndex * attribute.itemSize + component] = attribute.getComponent(
            sourceVertexIndex,
            component,
          );
        }
      }

      geometry.setAttribute(name, new THREE.BufferAttribute(values, attribute.itemSize, false));
    }

    geometry.setIndex(overlayIndexes);
    geometry.computeBoundingSphere();

    const sourceMaterial = Array.isArray(source.material) ? source.material[0] : source.material;
    if (!sourceMaterial) {
      geometry.dispose();
      return null;
    }

    const material = this.createFaceHighlightMaterials(sourceMaterial, candidate);
    for (const current of Array.isArray(material) ? material : [material]) {
      current.depthWrite = false;
      current.polygonOffset = true;
      current.polygonOffsetFactor = -1;
      current.polygonOffsetUnits = -1;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'measurement-face-highlight';
    mesh.userData.dimsightFaceOverlay = true;
    mesh.frustumCulled = source.frustumCulled;
    mesh.layers.mask = source.layers.mask;
    mesh.renderOrder = source.renderOrder + 1;
    mesh.position.copy(source.position);
    mesh.quaternion.copy(source.quaternion);
    mesh.scale.copy(source.scale);
    mesh.matrixAutoUpdate = source.matrixAutoUpdate;
    if (!mesh.matrixAutoUpdate) mesh.matrix.copy(source.matrix);
    mesh.visible = this.isObjectVisible(source);

    const overlay = { mesh, source };
    source.parent.add(mesh);
    this.faceOverlays.add(overlay);
    return overlay;
  }

  private createLabel(text: string, background: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 96;

    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Could not create label canvas');
    }

    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = '#f7f6ef';
    context.font = '500 40px ui-monospace, monospace';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.SpriteMaterial({
      depthTest: false,
      map: texture,
      toneMapped: false,
    });

    const label = new THREE.Sprite(material);
    label.renderOrder = 6;

    return label;
  }

  private createLine(
    points: readonly THREE.Vector3[],
    name: string,
    color: number,
    options: { depthTest?: boolean; depthWrite?: boolean } = {},
  ): Line2 {
    const material = new LineMaterial({
      color,
      depthTest: options.depthTest ?? false,
      depthWrite: options.depthWrite ?? true,
      linewidth: 3,
      opacity: 1,
      toneMapped: false,
      transparent: false,
    });

    const geometry = new LineGeometry();
    geometry.setFromPoints([...points]);

    const line = new Line2(geometry, material);
    line.name = name;
    line.renderOrder = 5;

    return line;
  }

  private createMeasurementPoint(position: THREE.Vector3, name: string): THREE.Mesh {
    const point = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 8),
      new THREE.MeshBasicMaterial({
        color: 0x4340ff,
        depthTest: false,
        toneMapped: false,
      }),
    );
    point.name = name;
    point.position.copy(position);
    point.renderOrder = 5;
    return point;
  }

  private disposeFaceOverlay(overlay: { mesh: THREE.Mesh; source: THREE.Mesh }): void {
    this.faceOverlays.delete(overlay);
    overlay.mesh.parent?.remove(overlay.mesh);
    overlay.mesh.geometry.dispose();

    for (const material of Array.isArray(overlay.mesh.material)
      ? overlay.mesh.material
      : [overlay.mesh.material]) {
      material.dispose();
    }
  }

  private disposeGroup(group: THREE.Object3D): void {
    group.traverse((object) => {
      if (
        object instanceof THREE.Mesh ||
        object instanceof THREE.Line ||
        object instanceof THREE.LineSegments
      ) {
        object.geometry.dispose();

        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material]) {
          material.dispose();
        }
      }

      if (object instanceof THREE.Sprite) {
        object.material.map?.dispose();
        object.material.dispose();
      }
    });
  }

  private isObjectVisible(object: THREE.Object3D): boolean {
    let current: THREE.Object3D | null = object;

    while (current) {
      if (!current.visible) return false;
      current = current.parent;
    }

    return true;
  }

  private update(): void {
    for (const { mesh, source } of this.faceOverlays) {
      mesh.visible = this.isObjectVisible(source);
    }

    if (this.pointPreview) {
      const size = this.viewport.worldHeightForPixels(7);

      this.pointPreview.scale.setScalar(size);
    }

    const label = this.measurement?.getObjectByName('measurement-label');

    if (label instanceof THREE.Sprite) {
      const height = this.viewport.worldHeightForPixels(28);

      label.scale.set(height * (512 / 96), height, 1);
    }

    for (const point of this.measurement?.children ?? []) {
      if (
        !(point instanceof THREE.Mesh) ||
        (point.name !== 'measurement-start' && point.name !== 'measurement-end')
      ) {
        continue;
      }

      const size = this.viewport.worldHeightForPixels(7);
      point.scale.setScalar(size);
    }
  }
}
