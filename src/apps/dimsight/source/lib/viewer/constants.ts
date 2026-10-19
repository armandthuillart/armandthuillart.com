import { CAMERA_ANGLES } from '../../native/contract.ts';
import type { Vector3 } from '../../native/contract.ts';
import type { UICameraAngle } from './types';

export const UI_CAMERA_ANGLES = [
  CAMERA_ANGLES[0],
  CAMERA_ANGLES[1],
  CAMERA_ANGLES[2],
  CAMERA_ANGLES[3],
  CAMERA_ANGLES[4],
  CAMERA_ANGLES[5],
  'rear-left',
  'rear-right',
  CAMERA_ANGLES[6],
] as const;

export const UI_CAMERA_DIRECTIONS = {
  back: [0, 0, -1],
  bottom: [0, -1, 0],
  front: [0, 0, 1],
  isometric: [1, 1, 1],
  left: [-1, 0, 0],
  'rear-left': [-1, 1, -1],
  'rear-right': [1, 1, -1],
  right: [1, 0, 0],
  top: [0, 1, 0],
} satisfies Record<UICameraAngle, Vector3>;

export const UI_VISUAL_STYLES = ['wireframe', 'shaded-with-edges', 'shades-of-gray'] as const;

export const DEFAULT_UI_VISUAL_STYLE: (typeof UI_VISUAL_STYLES)[number] = 'shaded-with-edges';

export const UI_MEASUREMENT_TOOLS = [
  'angle',
  'face-to-face',
  'diameter',
  'point-to-point',
] as const;

export const UI_CUTTING_PLANES = ['top', 'right', 'diagonal'] as const;

export const UI_VIEW_MODES = ['2d', '3d'] as const;
