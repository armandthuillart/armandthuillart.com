import { z } from 'zod';

type RequestEndpoint = '/dwg-preflight' | '/dwg-to-svg' | '/step-to-glb';

const CURVE_KINDS = ['line', 'circle', 'ellipse', 'bezier', 'bspline', 'other'] as const;
const SURFACE_KINDS = ['plane', 'cylinder', 'cone', 'sphere', 'torus', 'other'] as const;

export const CAMERA_ANGLES = [
  'isometric',
  'front',
  'back',
  'left',
  'right',
  'bottom',
  'top',
] as const;
const cameraAnglesSchema = z.enum(CAMERA_ANGLES);
export type CameraAngle = (typeof CAMERA_ANGLES)[number];

export const DRAWING_VIEWS = [
  'front',
  'back',
  'left',
  'right',
  'top',
  'bottom',
  'isometric',
  'dimetric',
  'trimetric',
  'section',
  'detail',
  'auxiliary',
  'projected',
] as const;
export type DrawingView = (typeof DRAWING_VIEWS)[number];

const PROGRESS_PHASES = ['analyze', 'convert', 'optimize', 'prepare'] as const;
const progressPhaseSchema = z.enum(PROGRESS_PHASES);
type ProgressPhase = (typeof PROGRESS_PHASES)[number];

const progressEventSchema = z.object({
  event: z.literal('progress'),
  phase: progressPhaseSchema,
  progress: z.number().min(0).max(100),
  stage: z.string().optional(),
});

const stepToGlbRequestSchema = z.object({
  urls: z.object({
    glb: z.string(),
    manifest: z.string(),
    step: z.string(),
    webps: z.record(z.enum(CAMERA_ANGLES), z.string()),
  }),
});
type StepToGlbRequest = z.infer<typeof stepToGlbRequestSchema>;

const dwgToSvgRequestSchema = z.object({
  urls: z.object({
    dwg: z.string(),
    svg: z.string(),
  }),
});
type DwgToSvgRequest = z.infer<typeof dwgToSvgRequestSchema>;

const dwgPreflightRequestSchema = z.object({ urls: z.object({ dwg: z.string() }) });
type DwgPreflightRequest = z.infer<typeof dwgPreflightRequestSchema>;

const dwgPreflightIssueSchema = z.object({
  code: z.string(),
  details: z.array(z.string()),
  message: z.string(),
});
type DwgPreflightIssue = z.infer<typeof dwgPreflightIssueSchema>;

const dwgPreflightResultSchema = z.object({
  errors: z.array(dwgPreflightIssueSchema),
  ok: z.boolean(),
});
type DwgPreflightResult = z.infer<typeof dwgPreflightResultSchema>;

const vector3Schema = z.tuple([z.number(), z.number(), z.number()]);
export type Vector3 = z.infer<typeof vector3Schema>;

const boundsSchema = z.object({
  max: vector3Schema,
  min: vector3Schema,
});
export type Bounds = z.infer<typeof boundsSchema>;

const faceBindingSchema = z.object({
  diameter: z
    .object({
      axisDirection: vector3Schema,
      axisPoint: vector3Schema,
      millimeters: z.number(),
    })
    .optional(),
  entityId: z.string(),
  occurrenceId: z.string(),
  plane: z
    .object({
      normal: vector3Schema,
      origin: vector3Schema,
    })
    .optional(),
  primitiveIndex: z.number().int().nonnegative().optional(),
  surfaceKind: z.enum(SURFACE_KINDS),
});
export type FaceBinding = z.infer<typeof faceBindingSchema>;

const edgeBindingSchema = z.object({
  curveKind: z.enum(CURVE_KINDS),
  endpoints: z.tuple([vector3Schema, vector3Schema]).nullable(),
  entityId: z.string(),
  occurrenceId: z.string(),
  primitiveIndex: z.number().int().nonnegative().optional(),
});
export type EdgeBinding = z.infer<typeof edgeBindingSchema>;

export const manifestBodySchema = z.object({
  entities: z.array(
    z.discriminatedUnion('kind', [
      z.object({
        bounds: boundsSchema,
        kind: z.literal('occurrence'),
      }),
      faceBindingSchema.extend({ kind: z.literal('face') }),
      edgeBindingSchema.extend({ kind: z.literal('edge') }),
    ]),
  ),
});

interface ConversionResult {
  metrics: {
    counts: { faces: number; triangles: number };
    timingsMs: Record<string, number>;
  };
  outputs: {
    glb: string;
    manifest: string;
    webps: Record<CameraAngle, string>;
  };
}
