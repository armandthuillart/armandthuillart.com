import * as THREE from 'three';
import { acceleratedRaycast, MeshBVH } from 'three-mesh-bvh';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineSegments2 } from 'three/addons/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/addons/lines/LineSegmentsGeometry.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

import type { Bounds, EdgeBinding, FaceBinding } from '../../native/contract.ts';
import { DEFAULT_UI_VISUAL_STYLE } from './constants';
import type {
  UIVisualStyle,
  EdgeLandmark,
  GltfAssociation,
  VisualizationSource,
  ExplodedPart,
  FaceReference,
  FaceRange,
} from './types';
import type { Viewport } from './viewport';

export class Visualization {
  private bounds = new THREE.Box3();

  private clippingPlanes: THREE.Plane[] = [];

  private readonly edgeLandmarks: EdgeLandmark[][] = [];

  private readonly edgeMaterial = new LineMaterial({
    alphaToCoverage: true,
    color: 0x242424,
    depthWrite: false,
    linewidth: 1,
    opacity: 0.9,
    toneMapped: false,
    transparent: true,
  });
  private readonly edges = new Set<LineSegments2>();
  private exactBounds: THREE.Box3 | null = null;

  private readonly explodedParts = new Map<THREE.Object3D, ExplodedPart>();
  private explosion = 0;
  private readonly faceBindings = new Map<string, FaceBinding>();
  private readonly faceRanges = new Map<THREE.Mesh, FaceRange[]>();
  private readonly fixedEdges = new Set<LineSegments2>();
  private landmarkRevision = 0;
  private readonly loader = new GLTFLoader();
  private readonly originalMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private readonly originalTextures = new Map<THREE.Material, THREE.Texture | null>();
  private readonly parts = new Map<string, Set<THREE.Object3D>>();

  private readonly primitiveIndexes = new Map<THREE.Mesh, number>();

  private root: THREE.Group | null = null;

  private readonly shadedMaterial = new THREE.MeshStandardMaterial({
    // OCCT's default preview surface is 0.47 sRGB, or #787878. Its default
    // PBR material is a non-metallic, fully rough surface.
    color: 0x787878,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
    roughness: 1,
    side: THREE.DoubleSide,
  });

  private sourceHasColors = false;
  private readonly surfaceMeshes: THREE.Mesh[] = [];
  private readonly transparentMaterials = new Map<THREE.Mesh, THREE.Material | THREE.Material[]>();
  private unsubscribeBeforeRender: (() => void) | null = null;
  private visualStyle: UIVisualStyle = DEFAULT_UI_VISUAL_STYLE;

  constructor(private readonly viewport: Viewport) {
    this.loader.setMeshoptDecoder(MeshoptDecoder);

    this.unsubscribeBeforeRender = viewport.subscribeBeforeRender(() => {
      this.edgeMaterial.linewidth =
        (1.35 * THREE.MathUtils.clamp(viewport.getCameraZoom(), 0.5, 2)) /
        Math.max(viewport.getPixelRatio(), 1);
    });
  }

  dispose(): void {
    this.unsubscribeBeforeRender?.();
    this.unsubscribeBeforeRender = null;

    this.disposeLoadedVisualization();
    this.edgeMaterial.dispose();
    this.shadedMaterial.dispose();
  }

  findPartId(object: THREE.Object3D): string | null {
    let current: THREE.Object3D | null = object;

    while (current) {
      if (typeof current.userData.kernelId === 'string') {
        return current.userData.kernelId;
      }

      current = current.parent;
    }

    return null;
  }

  getBounds(): THREE.Box3 {
    return this.bounds.clone();
  }

  getEdgeLandmarks(): readonly EdgeLandmark[][] {
    return this.edgeLandmarks;
  }

  getExactBounds(): THREE.Box3 | null {
    return this.exactBounds?.clone() ?? null;
  }

  getFaceBinding(mesh: THREE.Mesh, triangleIndex = 0): FaceBinding | null {
    return this.getFaceReference(mesh, triangleIndex)?.binding ?? null;
  }

  getFaceReference(mesh: THREE.Mesh, triangleIndex = 0): FaceReference | null {
    const occurrenceId = this.findPartId(mesh);
    if (!occurrenceId) return null;

    const triangleTotal = this.getTriangleCount(mesh);
    if (!Number.isInteger(triangleIndex) || triangleIndex < 0 || triangleIndex >= triangleTotal) {
      return null;
    }

    const ranges = this.getFaceRanges(mesh);

    const range = ranges?.find(
      ({ triangleCount, triangleStart }) =>
        triangleIndex >= triangleStart && triangleIndex < triangleStart + triangleCount,
    );

    const primitiveIndex =
      range?.primitiveIndex ?? (ranges.length === 0 ? this.primitiveIndexes.get(mesh) : undefined);
    if (primitiveIndex === undefined) return null;

    const binding = this.faceBindings.get(`${occurrenceId}:${primitiveIndex}`);
    if (!binding) return null;

    const triangleStart = range?.triangleStart ?? 0;
    const triangleCount = range?.triangleCount ?? this.getTriangleCount(mesh);
    if (
      triangleCount === 0 ||
      triangleStart + triangleCount > triangleTotal ||
      triangleIndex < triangleStart ||
      triangleIndex >= triangleStart + triangleCount
    ) {
      return null;
    }

    return {
      binding,
      mesh,
      triangleCount,
      triangleIndex,
      triangleStart,
    };
  }

  getFaceReferences(): FaceReference[] {
    const references: FaceReference[] = [];

    for (const mesh of this.surfaceMeshes) {
      const ranges = this.getFaceRanges(mesh);

      if (ranges.length === 0) {
        const reference = this.getFaceReference(mesh);
        if (reference) references.push(reference);
        continue;
      }

      for (const range of ranges) {
        const reference = this.getFaceReference(mesh, range.triangleStart);
        if (reference) references.push(reference);
      }
    }

    return references;
  }

  getLandmarkRevision(): number {
    return this.landmarkRevision;
  }

  getPartMeshes(partId: string): THREE.Mesh[] {
    const meshes = new Set<THREE.Mesh>();

    for (const root of this.parts.get(partId) ?? []) {
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        if (this.findPartId(object) !== partId) return;

        meshes.add(object);
      });
    }

    return [...meshes];
  }

  getPartObjects(partId: string): ReadonlySet<THREE.Object3D> | null {
    return this.parts.get(partId) ?? null;
  }

  getPickableObjects(): THREE.Object3D[] {
    return this.root ? [this.root] : [];
  }

  getSurfaceMeshes(): readonly THREE.Mesh[] {
    return this.surfaceMeshes;
  }

  getVisibleBounds(): THREE.Box3 {
    const bounds = new THREE.Box3();
    const visited = new Set<THREE.Object3D>();

    for (const objects of this.parts.values()) {
      for (const object of objects) {
        if (!this.isObjectVisible(object) || visited.has(object)) continue;

        visited.add(object);
        bounds.expandByObject(object);
      }
    }

    return bounds;
  }

  hidePart(partId: string): void {
    for (const object of this.parts.get(partId) ?? []) {
      object.visible = false;
    }

    this.landmarkRevision++;
    this.viewport.requestRender();
  }

  isolatePart(partId: string): void {
    for (const [currentPartId, objects] of this.parts) {
      for (const object of objects) {
        object.visible = currentPartId === partId;
      }
    }

    this.landmarkRevision++;
    this.viewport.requestRender();
  }

  isPartVisible(partId: string): boolean {
    const objects = this.parts.get(partId);
    if (!objects) return false;

    for (const object of objects) {
      if (this.isObjectVisible(object)) return true;
    }

    return false;
  }

  async load(source: VisualizationSource): Promise<void> {
    this.disposeLoadedVisualization();

    const gltf = await this.loader.loadAsync(source.visualizationUrl);
    const root = gltf.scene;

    root.name ||= source.name;
    root.updateMatrixWorld(true);

    const initialBounds = new THREE.Box3().setFromObject(root);
    const center = initialBounds.getCenter(new THREE.Vector3());

    root.position.sub(center);
    root.updateMatrixWorld(true);

    this.root = root;
    this.viewport.attach(root);

    this.replaceLineSegments(root);

    const occurrences = new Map<
      string,
      {
        edges: THREE.Object3D[];
        surfaces: THREE.Object3D[];
      }
    >();
    root.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        const association = gltf.parser.associations.get(object);

        if (typeof association?.primitives === 'number') {
          this.primitiveIndexes.set(object, association.primitives);
        }
      }

      if (object instanceof LineSegments2) {
        this.edges.add(object);

        let owner: THREE.Object3D | null = object;

        while (owner && owner.userData.kernelRole !== 'featureEdges') {
          owner = owner.parent;
        }

        if (!owner) {
          this.fixedEdges.add(object);
          return;
        }
      }

      const occurrenceId = object.userData.kernelId;

      if (typeof occurrenceId === 'string') {
        const occurrence = occurrences.get(occurrenceId) ?? {
          edges: [],
          surfaces: [],
        };

        if (object.userData.kernelRole === 'featureEdges') {
          occurrence.edges.push(object);
        } else {
          occurrence.surfaces.push(object);
        }

        occurrences.set(occurrenceId, occurrence);
      }

      if (object instanceof LineSegments2 || !(object instanceof THREE.Mesh)) {
        return;
      }

      this.surfaceMeshes.push(object);
      this.prepareMesh(object);
    });

    const hasOwnedEdges = this.edges.size > this.fixedEdges.size;

    for (const edges of this.fixedEdges) {
      edges.visible = !hasOwnedEdges;
    }

    this.createParts(root, occurrences);

    const visibleBounds = this.getVisibleBounds();
    this.bounds.copy(
      visibleBounds.isEmpty() ? new THREE.Box3().setFromObject(root) : visibleBounds,
    );
    this.setVisualStyle(this.visualStyle);
    this.viewport.resetBounds(this.bounds);
    this.viewport.updateLighting(this.bounds);
    this.viewport.renderImmediately();
  }

  makePartTransparent(partId: string): void {
    for (const mesh of this.getPartMeshes(partId)) {
      if (this.transparentMaterials.has(mesh)) continue;

      this.transparentMaterials.set(mesh, mesh.material);

      const transparentMaterials = (
        Array.isArray(mesh.material) ? mesh.material : [mesh.material]
      ).map((material) => {
        const transparent = material.clone();
        transparent.depthWrite = false;
        transparent.opacity = 0.25;
        transparent.transparent = true;
        this.applyClippingPlanes(transparent);
        return transparent;
      });

      mesh.material = Array.isArray(mesh.material) ? transparentMaterials : transparentMaterials[0];
    }

    this.viewport.requestRender();
  }

  restoreAllParts(): void {
    for (const objects of this.parts.values()) {
      for (const object of objects) {
        object.visible = true;
      }
    }

    this.restoreTransparentParts();
    this.landmarkRevision++;
    this.viewport.requestRender();
  }

  restoreTransparentParts(): void {
    for (const [mesh, original] of this.transparentMaterials) {
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        material.dispose();
      }

      mesh.material = original;
    }

    this.transparentMaterials.clear();
  }

  setBounds({ max, min }: Bounds): void {
    if (!this.root) return;

    this.exactBounds = new THREE.Box3(
      new THREE.Vector3(...min).multiplyScalar(0.001).add(this.root.position),
      new THREE.Vector3(...max).multiplyScalar(0.001).add(this.root.position),
    );

    this.viewport.requestRender();
  }

  setClippingPlanes(planes: readonly THREE.Plane[]): void {
    this.clippingPlanes = [...planes];

    this.applyClippingPlanes(this.edgeMaterial);
    this.applyClippingPlanes(this.shadedMaterial);

    this.root?.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;

      this.applyClippingPlanes(object.material);
    });

    this.viewport.requestRender();
  }

  setEdgeBindings(bindings: readonly EdgeBinding[]): void {
    if (!this.root) return;

    this.edgeLandmarks.length = 0;
    this.root.updateMatrixWorld(true);

    for (const binding of bindings) {
      if (!binding.endpoints) continue;
      const [first, last] = binding.endpoints;

      if (first.every((coordinate, index) => coordinate === last[index])) {
        continue;
      }

      let owner = this.parts.get(binding.occurrenceId)?.values().next().value ?? null;

      while (owner && owner !== this.root && !this.explodedParts.has(owner)) {
        owner = owner.parent;
      }

      const landmarkOwner = owner && this.explodedParts.has(owner) ? owner : this.root;

      const landmarks = [first, last].map((measurementPosition) => {
        const worldPosition = this.root!.localToWorld(
          new THREE.Vector3(...measurementPosition).multiplyScalar(0.001),
        );

        const localPosition = landmarkOwner.worldToLocal(worldPosition);
        const explodedPart = this.explodedParts.get(landmarkOwner);

        if (explodedPart) {
          localPosition.add(landmarkOwner.position).sub(explodedPart.position);
        }

        return {
          binding,
          measurementPosition,
          object: landmarkOwner,
          position: localPosition,
        };
      });

      this.edgeLandmarks.push(landmarks);
    }

    this.landmarkRevision++;
  }

  setExplosion(amount: number): void {
    this.explosion = THREE.MathUtils.clamp(amount, 0, 1);

    for (const [part, { direction, position }] of this.explodedParts) {
      part.position.copy(position).addScaledVector(direction, this.explosion);
    }

    this.root?.updateMatrixWorld(true);
    this.landmarkRevision++;
    this.updateEdgeVisibility();
    this.viewport.requestRender();
  }

  setFaceBindings(bindings: readonly FaceBinding[]): void {
    if (!this.root) return;

    this.faceBindings.clear();

    for (const binding of bindings) {
      if (binding.primitiveIndex === undefined) continue;

      this.faceBindings.set(`${binding.occurrenceId}:${binding.primitiveIndex}`, binding);
    }
  }

  setVisualStyle(mode: UIVisualStyle): void {
    this.restoreTransparentParts();
    this.visualStyle = mode;

    this.root?.traverse((object) => {
      if (object instanceof LineSegments2 || !(object instanceof THREE.Mesh)) {
        return;
      }

      const original = this.originalMaterials.get(object) ?? object.material;

      if (mode === 'shades-of-gray' || (mode === 'shaded-with-edges' && !this.sourceHasColors)) {
        object.material = Array.isArray(original)
          ? original.map(() => this.shadedMaterial)
          : this.shadedMaterial;
      } else {
        object.material = original;

        for (const material of Array.isArray(original) ? original : [original]) {
          if ('map' in material) {
            material.map =
              mode === 'shaded-with-edges' ? (this.originalTextures.get(material) ?? null) : null;
          }

          if ('wireframe' in material) {
            material.wireframe = mode === 'wireframe';
          }

          material.needsUpdate = true;
        }
      }

      this.applyClippingPlanes(object.material);
    });

    this.updateEdgeVisibility();
    this.viewport.requestRender();
  }

  private applyClippingPlanes(material: THREE.Material | THREE.Material[]): void {
    for (const current of Array.isArray(material) ? material : [material]) {
      current.clippingPlanes = this.clippingPlanes.length ? this.clippingPlanes : null;
    }
  }

  private createParts(
    root: THREE.Group,
    occurrences: ReadonlyMap<
      string,
      {
        edges: THREE.Object3D[];
        surfaces: THREE.Object3D[];
      }
    >,
  ): void {
    const explosionCenter = new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3());

    const worldToLocal = new THREE.Matrix3().setFromMatrix4(root.matrixWorld).invert();

    for (const [partId, { edges, surfaces }] of occurrences) {
      const objects = new Set([...surfaces, ...edges]);
      this.parts.set(partId, objects);

      if (edges.length === 0 || surfaces.length === 0) continue;

      const bounds = new THREE.Box3();

      for (const surface of surfaces) {
        bounds.expandByObject(surface);
      }

      const direction = bounds
        .getCenter(new THREE.Vector3())
        .sub(explosionCenter)
        .applyMatrix3(worldToLocal);

      const part = new THREE.Group();
      part.name = `${partId}:exploded`;
      root.add(part);

      for (const object of objects) {
        part.attach(object);
      }

      const position = part.position.clone();
      part.userData.originalPosition = position.clone();

      this.explodedParts.set(part, {
        direction,
        position,
      });
    }
  }

  private disposeLoadedVisualization(): void {
    this.restoreTransparentParts();

    if (this.root) {
      this.viewport.detach(this.root);

      const disposedGeometries = new Set<THREE.BufferGeometry>();
      const disposedMaterials = new Set<THREE.Material>();
      const disposedTextures = new Set<THREE.Texture>();

      this.root.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (!disposedGeometries.has(object.geometry)) {
            disposedGeometries.add(object.geometry);
            object.geometry.boundsTree = undefined;
            object.geometry.dispose();
          }

          const original = this.originalMaterials.get(object) ?? object.material;

          for (const material of Array.isArray(original) ? original : [original]) {
            if (!disposedMaterials.has(material)) {
              disposedMaterials.add(material);

              for (const property of Object.values(material)) {
                if (property instanceof THREE.Texture && !disposedTextures.has(property)) {
                  disposedTextures.add(property);
                  property.dispose();
                }
              }

              material.dispose();
            }
          }
        }

        if (object instanceof LineSegments2) {
          object.geometry.dispose();

          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material]) {
            if (material !== this.edgeMaterial) material.dispose();
          }
        }
      });
    }

    this.root = null;
    this.bounds.makeEmpty();
    this.exactBounds = null;

    this.edges.clear();
    this.fixedEdges.clear();
    this.parts.clear();
    this.explodedParts.clear();
    this.primitiveIndexes.clear();
    this.faceBindings.clear();
    this.faceRanges.clear();
    this.edgeLandmarks.length = 0;
    this.surfaceMeshes.length = 0;
    this.landmarkRevision++;
    this.originalMaterials.clear();
    this.originalTextures.clear();

    this.sourceHasColors = false;
    this.explosion = 0;
  }

  private getFaceRanges(mesh: THREE.Mesh): FaceRange[] {
    const cached = this.faceRanges.get(mesh);
    if (cached !== undefined) return cached;

    const value = mesh.geometry.userData.faceRanges;
    const ranges = !Array.isArray(value)
      ? []
      : value
          .filter(
            (
              range,
            ): range is {
              count: number;
              index: number;
              start: number;
            } =>
              !!range &&
              typeof range === 'object' &&
              typeof range.index === 'number' &&
              Number.isInteger(range.index) &&
              range.index >= 0 &&
              typeof range.start === 'number' &&
              Number.isInteger(range.start) &&
              range.start >= 0 &&
              typeof range.count === 'number' &&
              Number.isInteger(range.count) &&
              range.count > 0,
          )
          .map((range): FaceRange => ({
            primitiveIndex: range.index,
            triangleCount: range.count,
            triangleStart: range.start,
          }));

    this.faceRanges.set(mesh, ranges);
    return ranges;
  }

  private getTriangleCount(mesh: THREE.Mesh): number {
    const count =
      mesh.geometry.getIndex()?.count ?? mesh.geometry.getAttribute('position')?.count ?? 0;
    return Math.floor(count / 3);
  }

  private isObjectVisible(object: THREE.Object3D): boolean {
    let current: THREE.Object3D | null = object;

    while (current) {
      if (!current.visible) return false;
      current = current.parent;
    }

    return true;
  }

  private meshHasSourceColors(mesh: THREE.Mesh): boolean {
    if (mesh.geometry.getAttribute('color')) return true;

    return (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).some((material) => {
      const source = material as THREE.Material & {
        color?: THREE.Color;
        map?: THREE.Texture | null;
      };

      if (source.map) return true;

      return (
        source.color instanceof THREE.Color &&
        (source.color.r < 0.99 || source.color.g < 0.99 || source.color.b < 0.99)
      );
    });
  }

  private prepareMesh(mesh: THREE.Mesh): void {
    this.originalMaterials.set(mesh, mesh.material);
    this.sourceHasColors ||= this.meshHasSourceColors(mesh);
    mesh.geometry.computeBoundingSphere();
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    if (this.getTriangleCount(mesh) > 0) {
      mesh.raycast = acceleratedRaycast;
      mesh.geometry.boundsTree ??= new MeshBVH(mesh.geometry, { indirect: true });
    }

    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      material.side = THREE.DoubleSide;
      material.polygonOffset = true;
      material.polygonOffsetFactor = 1;
      material.polygonOffsetUnits = 1;

      if (
        material instanceof THREE.MeshStandardMaterial &&
        material.metalness === 1 &&
        material.roughness === 1
      ) {
        const { b, g, r } = material.color;
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        const isNeutral = chroma < 0.025;

        material.metalness = isNeutral ? 0.45 : 0;
        material.roughness = isNeutral ? 0.45 : 0.82;
        if (isNeutral) material.color.multiplyScalar(1.2);
      }

      if ('map' in material) {
        const mappedMaterial = material as THREE.Material & { map: THREE.Texture | null };
        this.originalTextures.set(material, mappedMaterial.map);
        if (mappedMaterial.map) {
          mappedMaterial.map.anisotropy = this.viewport.getMaxAnisotropy();
        }
      }
    }
  }

  private replaceLineSegments(root: THREE.Group): void {
    const originalLines: THREE.LineSegments[] = [];

    root.traverse((object) => {
      if (object instanceof THREE.LineSegments && !(object instanceof LineSegments2)) {
        originalLines.push(object);
      }
    });

    for (const line of originalLines) {
      const parent = line.parent;
      const position = line.geometry.getAttribute('position');

      if (!parent || !position) continue;

      const index = line.geometry.getIndex();
      const count = index ? index.count : position.count;
      const positions = new Float32Array(count * 3);

      for (let offset = 0; offset < count; offset++) {
        const vertex = index ? index.getX(offset) : offset;

        positions[offset * 3] = position.getX(vertex);
        positions[offset * 3 + 1] = position.getY(vertex);
        positions[offset * 3 + 2] = position.getZ(vertex);
      }

      const geometry = new LineSegmentsGeometry();
      geometry.setPositions(positions);

      const replacement = new LineSegments2(geometry, this.edgeMaterial);
      replacement.name = line.name;
      replacement.position.copy(line.position);
      replacement.quaternion.copy(line.quaternion);
      replacement.scale.copy(line.scale);
      replacement.matrix.copy(line.matrix);
      replacement.matrixAutoUpdate = line.matrixAutoUpdate;
      replacement.visible = line.visible;
      replacement.renderOrder = 2;
      replacement.userData = line.userData;
      replacement.layers.mask = line.layers.mask;

      while (line.children.length > 0) {
        replacement.add(line.children[0]);
      }

      parent.add(replacement);
      parent.remove(line);

      line.geometry.dispose();

      for (const material of Array.isArray(line.material) ? line.material : [line.material]) {
        material.dispose();
      }
    }
  }

  private updateEdgeVisibility(): void {
    const hasOwnedEdges = this.edges.size > this.fixedEdges.size;
    const visibleOwnedEdges = new Set<LineSegments2>();

    for (const objects of this.parts.values()) {
      const visible = [...objects].some(
        (object) => !(object instanceof LineSegments2) && this.isObjectVisible(object),
      );

      if (!visible) continue;

      for (const object of objects) {
        if (object instanceof LineSegments2) visibleOwnedEdges.add(object);
      }
    }

    for (const edges of this.edges) {
      edges.visible = this.fixedEdges.has(edges)
        ? this.explosion === 0 && !hasOwnedEdges
        : visibleOwnedEdges.has(edges);
    }
  }
}
