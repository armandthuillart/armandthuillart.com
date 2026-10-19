import type * as THREE from 'three';

import type { Bounds, EdgeBinding, FaceBinding, Vector3 } from '../../native/contract.ts';
import type {
  UI_CAMERA_ANGLES,
  UI_CUTTING_PLANES,
  UI_MEASUREMENT_TOOLS,
  UI_VISUAL_STYLES,
  UI_VIEW_MODES,
} from './constants';

export type AngleOverlay = {
  angleDegrees: number;
  directionA: THREE.Vector3;
  directionB: THREE.Vector3;
  origin: THREE.Vector3;
  radius: number;
};
export type AnglePick = {
  direction: THREE.Vector3;
  entityId: string;
  position: THREE.Vector3;
} & FaceReference;
export type CuttingPlaneState = Record<UICuttingPlane, boolean>;
export type DistanceOverlay = {
  distanceMm: number;
  from: THREE.Vector3;
  showPoints?: boolean;
  to: THREE.Vector3;
};
export type EdgeLandmark = {
  binding: EdgeBinding;
  measurementPosition: Vector3;
  object: THREE.Object3D;
  position: THREE.Vector3;
};
export type ExplodedPart = {
  direction: THREE.Vector3;
  position: THREE.Vector3;
};

export type FacePick = FaceReference & {
  position: THREE.Vector3;
};

export type FaceRange = {
  primitiveIndex: number;
  triangleStart: number;
  triangleCount: number;
};

export type FaceReference = {
  binding: FaceBinding;
  mesh: THREE.Mesh;
  triangleCount: number;
  triangleIndex: number;
  triangleStart: number;
};

export type GltfAssociation = { primitives?: number };

export type ParsedManifest = {
  bounds: Bounds | null;
  edges: EdgeBinding[];
  faces: FaceBinding[];
};

export type PartSelectionOptions = { onChange?: (partId: string | null) => void };

export type PointerStart = {
  id: number;
  x: number;
  y: number;
};

export type PointPick = {
  direction: THREE.Vector3;
  measurement: MeasurementPoint;
  position: THREE.Vector3;
};

export type ProjectedPoint = PointPick & {
  depth: number;
  occurrenceId: string;
  x: number;
  y: number;
};

export type SelectedFace = FaceReference;

export type SelectedPoint = {
  measurement: MeasurementPoint;
  position: THREE.Vector3;
};

export type Toolbar2dTools =
  | 'toggleCenterLines'
  | 'toggleDimensions'
  | 'toggleHashes'
  | 'toggleHiddenLines'
  | 'toggleSourceLabels';

export type Toolbar3dTools =
  | 'autoRotate'
  | 'boundingBox'
  | 'cameraAngles'
  | 'cuttingPlanes'
  | 'measurementTools'
  | 'resetAll'
  | 'takeScreenshot'
  | 'visualStyles';

export type UICameraAngle = (typeof UI_CAMERA_ANGLES)[number];

export type UICuttingPlane = (typeof UI_CUTTING_PLANES)[number];

export type UIMeasurementTool = (typeof UI_MEASUREMENT_TOOLS)[number];

export type UIViewMode = (typeof UI_VIEW_MODES)[number];

export type UIVisualStyle = (typeof UI_VISUAL_STYLES)[number];

export interface ViewerOptions {
  bottomInset?: number;
  onPartMenuRequested?: (position: ScreenPosition) => void;
}

export type ViewerState = {
  activeTool: UIMeasurementTool | null;
  autoRotationEnabled: boolean;
  boundingBoxVisible: boolean;
  cuttingPlanes: CuttingPlaneState;
  error: Error | null;
  explosion: number;
  visualStyle: UIVisualStyle;
  selectedPartId: string | null;
  status: ViewerStatus;
  cameraAngle: UICameraAngle;
};

export type ViewerStatus = 'empty' | 'loading' | 'ready' | 'failed';

export type ViewerSubscriber = (state: Readonly<ViewerState>) => void;

export type ViewportOptions = {
  bottomInset?: number;
};

export type ViewTransition = {
  fromDistance: number;
  fromQuaternion: THREE.Quaternion;
  fromTarget: THREE.Vector3;
  lastTime: number;
  progress: number;
  velocity: number;
  toQuaternion: THREE.Quaternion;
  toTarget: THREE.Vector3;
  toUp: THREE.Vector3;
};

export type VisualizationSource = {
  manifestUrl?: string | null;
  name: string;
  visualizationUrl: string;
};

type MeasurementPoint = {
  entityId: string;
  position: Vector3;
};

type ScreenPosition = { x: number; y: number };
