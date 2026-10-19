import * as THREE from 'three';

import type { Vector3 } from '../../native/contract.ts';
import type { SceneOverlays } from './scene-overlays';
import type {
  AnglePick,
  EdgeLandmark,
  FaceReference,
  ProjectedPoint,
  UIMeasurementTool,
  FacePick,
  PointPick,
  SelectedFace,
  SelectedPoint,
} from './types';
import { Viewport } from './viewport';
import type { Visualization } from './visualization';

const POINT_GRID_SIZE = 24;
const POINT_PICK_RADIUS = 28;

export class Measurements {
  private activeTool: null | UIMeasurementTool = null;
  private candidateFaces = new Set<string>();
  private hoveredPoint: ProjectedPoint | null = null;
  private readonly pointGrid = new Map<string, ProjectedPoint[]>();
  private pointGridBounds: {
    height: number;
    left: number;
    top: number;
    width: number;
  } | null = null;
  private pointGridCameraRevision = -1;
  private pointGridLandmarkRevision = -1;
  private readonly projectedPoints: ProjectedPoint[] = [];
  private selectedAngle: AnglePick | null = null;
  private selectedFace: SelectedFace | null = null;
  private selectedPoint: SelectedPoint | null = null;

  constructor(
    private readonly viewport: Viewport,
    private readonly visualization: Visualization,
    private readonly overlays: SceneOverlays,
  ) {}

  clear(): void {
    this.selectedFace = null;
    this.selectedPoint = null;
    this.selectedAngle = null;
    this.hoveredPoint = null;
    this.candidateFaces.clear();

    this.overlays.clearInteraction();
    this.overlays.clearMeasurement();
  }

  dispose(): void {
    this.clear();
    this.activeTool = null;
    this.pointGrid.clear();
    this.projectedPoints.length = 0;
  }

  getActiveTool(): UIMeasurementTool | null {
    return this.activeTool;
  }

  handleClick(clientX: number, clientY: number): boolean {
    switch (this.activeTool) {
      case 'face-to-face':
        return this.selectFaceDistance(clientX, clientY);

      case 'point-to-point':
        return this.selectPointDistance(clientX, clientY);

      case 'diameter':
        return this.selectDiameter(clientX, clientY);

      case 'angle':
        return this.selectAngle(clientX, clientY);

      default:
        return false;
    }
  }

  handlePointerLeave(): void {
    this.hoveredPoint = null;
    this.overlays.clearFacePreview();
    this.overlays.clearPointPreview();
  }

  handlePointerMove(clientX: number, clientY: number, buttons: number): void {
    if (buttons !== 0) {
      this.overlays.clearFacePreview();

      if (this.activeTool !== 'point-to-point') {
        this.hoveredPoint = null;
        this.overlays.clearPointPreview();
      }

      return;
    }

    if (this.activeTool === 'face-to-face') {
      const face = this.pickFace(clientX, clientY);

      if (
        face?.binding.plane &&
        (!this.selectedFace || this.candidateFaces.has(face.binding.entityId))
      ) {
        this.overlays.showFacePreview(face);
      } else {
        this.overlays.clearFacePreview();
      }

      return;
    }

    if (this.activeTool === 'point-to-point') {
      const point = this.pickPoint(clientX, clientY);

      if (point) {
        this.overlays.showPointPreview(point.position);
      } else {
        this.overlays.clearPointPreview();
      }

      return;
    }

    if (this.activeTool === 'angle') {
      this.previewAngle(clientX, clientY);
      return;
    }

    this.overlays.clearPointPreview();
  }

  refreshCandidates(): void {
    this.pointGridCameraRevision = -1;
    this.pointGridLandmarkRevision = -1;

    if (this.activeTool === 'diameter') {
      this.showDiameterCandidates();
    }
  }

  setTool(tool: UIMeasurementTool | null): void {
    if (tool === this.activeTool) return;

    this.clear();
    this.activeTool = tool;

    if (tool === 'diameter') {
      this.showDiameterCandidates();
    }
  }

  private areParallel(first: THREE.Vector3, second: THREE.Vector3): boolean {
    return Math.abs(first.dot(second)) >= Math.cos(THREE.MathUtils.degToRad(1));
  }

  private clearPendingSelection(): void {
    this.selectedFace = null;
    this.selectedPoint = null;
    this.selectedAngle = null;
    this.candidateFaces.clear();
    this.overlays.clearInteraction();
    this.overlays.clearMeasurement();

    if (this.activeTool === 'diameter') {
      this.showDiameterCandidates();
    }
  }

  private directionFromMillimeters(
    point: Vector3,
    direction: Vector3,
    object?: THREE.Object3D,
  ): THREE.Vector3 {
    const from = this.positionFromMillimeters(point, object);

    const endpoint: Vector3 = [
      point[0] + direction[0],
      point[1] + direction[1],
      point[2] + direction[2],
    ];

    return this.positionFromMillimeters(endpoint, object).sub(from).normalize();
  }

  private isObjectVisible(object: THREE.Object3D): boolean {
    let current: THREE.Object3D | null = object;

    while (current) {
      if (!current.visible) return false;
      current = current.parent;
    }

    return true;
  }

  private isPointVisible(point: ProjectedPoint): boolean {
    const hit = this.viewport
      .raycast(point.x, point.y, this.visualization.getSurfaceMeshes(), true)
      .find(({ object }) => this.isObjectVisible(object));

    if (!hit) return true;

    const tolerance = this.viewport.worldHeightForPixels(3);
    const distanceBehindHit = point.position
      .clone()
      .sub(hit.point)
      .dot(this.viewport.getCameraDirection());

    return distanceBehindHit <= tolerance;
  }

  private landmarkPosition(landmark: EdgeLandmark): THREE.Vector3 {
    return landmark.object.localToWorld(landmark.position.clone());
  }

  private pickAngle(clientX: number, clientY: number): AnglePick | null {
    const face = this.pickFace(clientX, clientY);

    if (!face?.binding.plane) {
      return null;
    }

    return {
      ...face,
      direction: this.directionFromMillimeters(
        face.binding.plane.origin,
        face.binding.plane.normal,
        face.mesh,
      ),
      entityId: face.binding.entityId,
    };
  }

  private pickFace(clientX: number, clientY: number): FacePick | null {
    const intersections = this.viewport.raycast(
      clientX,
      clientY,
      this.visualization.getSurfaceMeshes(),
      true,
    );

    for (const intersection of intersections) {
      if (
        !(intersection.object instanceof THREE.Mesh) ||
        !intersection.face ||
        !this.isObjectVisible(intersection.object)
      ) {
        continue;
      }

      if (intersection.object.userData.dimsightFaceOverlay) continue;

      const face = this.visualization.getFaceReference(
        intersection.object,
        intersection.faceIndex ?? 0,
      );
      if (!face) continue;

      return {
        ...face,
        position: intersection.point,
      };
    }

    return null;
  }

  private pickPoint(clientX: number, clientY: number): PointPick | null {
    this.rebuildPointGridIfNeeded();

    const cellX = Math.floor(clientX / POINT_GRID_SIZE);
    const cellY = Math.floor(clientY / POINT_GRID_SIZE);
    const cellRadius = Math.ceil(POINT_PICK_RADIUS / POINT_GRID_SIZE);
    const candidates: { point: ProjectedPoint; score: number }[] = [];

    for (let y = cellY - cellRadius; y <= cellY + cellRadius; y++) {
      for (let x = cellX - cellRadius; x <= cellX + cellRadius; x++) {
        for (const candidate of this.pointGrid.get(`${x}:${y}`) ?? []) {
          if (
            this.selectedPoint &&
            this.selectedPoint.position.distanceToSquared(candidate.position) < 0.000000000001
          ) {
            continue;
          }

          const cursorDistance = Math.hypot(candidate.x - clientX, candidate.y - clientY);
          if (cursorDistance >= POINT_PICK_RADIUS) continue;

          let score = cursorDistance + (candidate.depth + 1) * 0.5;

          if (candidate === this.hoveredPoint) score -= 4;
          candidates.push({ point: candidate, score });
        }
      }
    }

    candidates.sort((first, second) => first.score - second.score);

    for (const { point } of candidates) {
      if (!this.isPointVisible(point)) continue;

      this.hoveredPoint = point;
      return point;
    }

    if (
      this.hoveredPoint &&
      this.visualization.isPartVisible(this.hoveredPoint.occurrenceId) &&
      this.isPointVisible(this.hoveredPoint)
    ) {
      return this.hoveredPoint;
    }

    this.hoveredPoint = null;
    return null;
  }

  private positionFromMillimeters(position: Vector3, object?: THREE.Object3D): THREE.Vector3 {
    const root = this.visualization.getPickableObjects()[0];

    if (!root) return new THREE.Vector3();

    const worldPosition = root.localToWorld(new THREE.Vector3(...position).multiplyScalar(0.001));

    if (!object) return worldPosition;

    let owner: THREE.Object3D | null = object;

    while (owner && owner.parent && !owner.name.endsWith(':exploded')) {
      owner = owner.parent;
    }

    if (!owner?.name.endsWith(':exploded')) {
      return worldPosition;
    }

    const originalPosition = owner.userData.originalPosition;
    const parent = owner.parent;

    if (!(originalPosition instanceof THREE.Vector3) || !parent) {
      return worldPosition;
    }

    parent.updateMatrixWorld(true);

    return worldPosition.add(
      parent
        .localToWorld(owner.position.clone())
        .sub(parent.localToWorld(originalPosition.clone())),
    );
  }

  private previewAngle(clientX: number, clientY: number): void {
    const candidate = this.pickAngle(clientX, clientY);
    const selected = this.selectedAngle;

    if (
      !candidate ||
      (selected &&
        (candidate.entityId === selected.entityId ||
          this.areParallel(candidate.direction, selected.direction)))
    ) {
      this.overlays.clearFacePreview();
      return;
    }

    this.overlays.showFacePreview(candidate);
  }

  private rebuildPointGridIfNeeded(): void {
    const cameraRevision = this.viewport.getCameraRevision();
    const landmarkRevision = this.visualization.getLandmarkRevision();
    const bounds = this.viewport.getScreenBounds();
    const previousBounds = this.pointGridBounds;

    if (landmarkRevision !== this.pointGridLandmarkRevision) {
      this.rebuildProjectedPoints();
    }

    if (
      cameraRevision === this.pointGridCameraRevision &&
      landmarkRevision === this.pointGridLandmarkRevision &&
      previousBounds?.height === bounds.height &&
      previousBounds.left === bounds.left &&
      previousBounds.top === bounds.top &&
      previousBounds.width === bounds.width
    ) {
      return;
    }

    this.pointGrid.clear();
    this.pointGridCameraRevision = cameraRevision;
    this.pointGridLandmarkRevision = landmarkRevision;
    this.pointGridBounds = {
      height: bounds.height,
      left: bounds.left,
      top: bounds.top,
      width: bounds.width,
    };

    for (const point of this.projectedPoints) {
      if (!this.visualization.isPartVisible(point.occurrenceId)) continue;

      this.viewport.projectToScreen(point.position, bounds, point);
      if (point.depth < -1 || point.depth > 1) continue;

      const key = `${Math.floor(point.x / POINT_GRID_SIZE)}:${Math.floor(
        point.y / POINT_GRID_SIZE,
      )}`;
      const cell = this.pointGrid.get(key) ?? [];
      cell.push(point);
      this.pointGrid.set(key, cell);
    }
  }

  private rebuildProjectedPoints(): void {
    this.projectedPoints.length = 0;
    this.hoveredPoint = null;
    const seen = new Set<string>();

    for (const landmarks of this.visualization.getEdgeLandmarks()) {
      const first = landmarks[0];
      const last = landmarks.at(-1);
      if (!first || !last) continue;

      const firstPosition = this.landmarkPosition(first);
      const direction = this.landmarkPosition(last).sub(firstPosition).normalize();

      for (const landmark of landmarks) {
        const key = `${landmark.binding.occurrenceId}:${landmark.measurementPosition.join(':')}`;
        if (seen.has(key)) continue;
        seen.add(key);

        this.projectedPoints.push({
          depth: 0,
          direction,
          measurement: {
            entityId: landmark.binding.entityId,
            position: landmark.measurementPosition,
          },
          occurrenceId: landmark.binding.occurrenceId,
          position: this.landmarkPosition(landmark),
          x: 0,
          y: 0,
        });
      }
    }
  }

  private selectAngle(clientX: number, clientY: number): boolean {
    const candidate = this.pickAngle(clientX, clientY);

    if (!candidate) return false;

    this.overlays.clearFacePreview();

    if (!this.selectedAngle) {
      this.overlays.clearMeasurement();
      this.selectedAngle = candidate;
      this.overlays.selectFace(candidate);
      this.showAngleCandidates(candidate.direction);

      return true;
    }

    const selected = this.selectedAngle;

    if (
      candidate.entityId === selected.entityId ||
      this.areParallel(candidate.direction, selected.direction)
    ) {
      return false;
    }

    this.overlays.clearCandidateFaces();

    const firstDirection = selected.direction.clone();
    const secondDirection = candidate.direction.clone();
    const dot = firstDirection.dot(secondDirection);

    if (dot < 0) {
      secondDirection.negate();
    }

    const angleDegrees = THREE.MathUtils.radToDeg(
      Math.acos(THREE.MathUtils.clamp(Math.abs(dot), 0, 1)),
    );

    const origin = selected.position.clone().add(candidate.position).multiplyScalar(0.5);
    const radius = this.visualization.getBounds().getBoundingSphere(new THREE.Sphere()).radius;

    this.selectedAngle = null;
    this.overlays.clearInteraction();

    this.overlays.showAngle({
      angleDegrees,
      directionA: firstDirection,
      directionB: secondDirection,
      origin,
      radius,
    });

    return true;
  }

  private selectDiameter(clientX: number, clientY: number): boolean {
    const pick = this.pickFace(clientX, clientY);

    if (!pick?.binding.diameter || !this.candidateFaces.has(pick.binding.entityId)) {
      return false;
    }

    const { axisDirection, axisPoint, millimeters } = pick.binding.diameter;

    const centerReference = this.positionFromMillimeters(axisPoint, pick.mesh);

    const direction = this.directionFromMillimeters(axisPoint, axisDirection, pick.mesh);

    const center =
      pick.binding.surfaceKind === 'cylinder'
        ? centerReference
            .clone()
            .addScaledVector(direction, pick.position.clone().sub(centerReference).dot(direction))
        : centerReference;

    const radial = pick.position
      .clone()
      .sub(center)
      .addScaledVector(direction, -pick.position.clone().sub(center).dot(direction));

    if (radial.lengthSq() <= Number.EPSILON) {
      radial.crossVectors(direction, this.viewport.getCameraPosition().sub(center));

      if (radial.lengthSq() <= Number.EPSILON) {
        radial.crossVectors(direction, this.viewport.getCameraUp());
      }
    }

    const radius = millimeters * 0.0005;
    radial.normalize().multiplyScalar(radius);

    this.overlays.showDistance({
      distanceMm: millimeters,
      from: center.clone().sub(radial),
      showPoints: false,
      to: center.clone().add(radial),
    });

    this.showDiameterCandidates();
    return true;
  }

  private selectFaceDistance(clientX: number, clientY: number): boolean {
    const pick = this.pickFace(clientX, clientY);

    if (!pick?.binding.plane) return false;

    this.overlays.clearFacePreview();

    if (!this.selectedFace) {
      this.overlays.clearMeasurement();

      this.selectedFace = pick;

      this.overlays.selectFace(pick);
      this.showParallelFaceCandidates(pick.binding.plane.normal);
      return true;
    }

    if (pick.binding.entityId === this.selectedFace.binding.entityId) {
      return true;
    }

    if (!this.candidateFaces.has(pick.binding.entityId)) {
      return false;
    }

    const selected = this.selectedFace;
    const selectedPlane = selected.binding.plane;

    if (!selectedPlane) return false;

    const offset = selectedPlane.normal.reduce(
      (sum, coordinate, axis) =>
        sum + coordinate * (pick.binding.plane!.origin[axis] - selectedPlane.origin[axis]),
      0,
    );

    const to: Vector3 = [
      selectedPlane.origin[0] + selectedPlane.normal[0] * offset,
      selectedPlane.origin[1] + selectedPlane.normal[1] * offset,
      selectedPlane.origin[2] + selectedPlane.normal[2] * offset,
    ];

    const fromPosition = this.positionFromMillimeters(selectedPlane.origin, selected.mesh);
    const toPosition = this.positionFromMillimeters(to, pick.mesh);

    this.selectedFace = null;
    this.candidateFaces.clear();
    this.overlays.clearInteraction();

    this.overlays.showDistance({
      distanceMm: Math.abs(offset),
      from: fromPosition,
      to: toPosition,
    });

    return true;
  }

  private selectPointDistance(clientX: number, clientY: number): boolean {
    const pick = this.pickPoint(clientX, clientY);

    if (!pick) return false;

    this.overlays.clearPointPreview();

    if (!this.selectedPoint) {
      this.overlays.clearMeasurement();

      this.selectedPoint = {
        measurement: pick.measurement,
        position: pick.position,
      };
      this.hoveredPoint = null;

      this.overlays.showSelectedPoint(pick.position);
      return true;
    }

    if (this.selectedPoint.position.distanceTo(pick.position) < 0.000001) {
      return false;
    }

    const selected = this.selectedPoint;
    const from = selected.measurement.position;
    const to = pick.measurement.position;

    const distanceMm = Math.hypot(to[0] - from[0], to[1] - from[1], to[2] - from[2]);

    this.selectedPoint = null;
    this.overlays.clearPointPreview();

    this.overlays.showDistance({
      distanceMm,
      from: selected.position,
      to: pick.position,
    });

    return true;
  }

  private showAngleCandidates(selectedDirection: THREE.Vector3): void {
    this.overlays.clearCandidateFaces();
    const candidates: FaceReference[] = [];

    for (const face of this.visualization.getFaceReferences()) {
      if (!this.isObjectVisible(face.mesh)) continue;

      const binding = face.binding;

      if (!binding.plane || binding.entityId === this.selectedAngle?.entityId) {
        continue;
      }

      const direction = this.directionFromMillimeters(
        binding.plane.origin,
        binding.plane.normal,
        face.mesh,
      );

      if (this.areParallel(direction, selectedDirection)) {
        continue;
      }

      candidates.push(face);
    }

    this.overlays.showCandidateFaces(candidates);
  }

  private showDiameterCandidates(): void {
    const candidates: FaceReference[] = [];
    this.candidateFaces.clear();

    for (const face of this.visualization.getFaceReferences()) {
      if (!this.isObjectVisible(face.mesh)) continue;

      const binding = face.binding;

      if (!binding.diameter) continue;

      candidates.push(face);
      this.candidateFaces.add(binding.entityId);
    }

    this.overlays.showCandidateFaces(candidates);
  }

  private showParallelFaceCandidates(selectedNormal: Vector3): void {
    const candidates: FaceReference[] = [];
    const normal = new THREE.Vector3(...selectedNormal);
    this.candidateFaces.clear();

    for (const face of this.visualization.getFaceReferences()) {
      if (!this.isObjectVisible(face.mesh)) continue;

      const binding = face.binding;

      if (!binding.plane || binding.entityId === this.selectedFace?.binding.entityId) {
        continue;
      }

      const candidateNormal = new THREE.Vector3(...binding.plane.normal);

      if (Math.abs(candidateNormal.dot(normal)) < 1 - 1e-10) {
        continue;
      }

      candidates.push(face);
      this.candidateFaces.add(binding.entityId);
    }

    this.overlays.showCandidateFaces(candidates);
  }
}
