export type DimsightProject = {
  id: string;
  name: string;
  source: string;
  uploadedAt: string;
  size: string;
  shared: boolean;
  latestVersion: string;
  versions: DimsightVersion[];
};
type DimsightLayout = 'grid' | 'list';
type DimsightOrder = 'latest' | 'oldest';

type DimsightVersion = {
  id: string;
  label: string;
  createdAt: string;
  state: 'ready' | 'processing' | 'draft';
};

type DimsightView = 'projects' | 'viewer';

const dimsightViewUrls = {
  back: '/apps/dimsight/assets/views/back.webp',
  bottom: '/apps/dimsight/assets/views/bottom.webp',
  front: '/apps/dimsight/assets/views/front.webp',
  isometric: '/apps/dimsight/assets/views/isometric.webp',
  left: '/apps/dimsight/assets/views/left.webp',
  right: '/apps/dimsight/assets/views/right.webp',
  top: '/apps/dimsight/assets/views/top.webp',
} as const;

type DimsightAngle = keyof typeof dimsightViewUrls;

export const initialDimsightProjects: DimsightProject[] = [
  {
    id: 'assembly',
    latestVersion: 'V3',
    name: 'Industrial sample assembly',
    shared: true,
    size: '402 KB',
    source: 'sample-assembly.step',
    uploadedAt: 'Oct 14, 2026',
    versions: [
      {
        createdAt: 'Oct 10, 2026 · 09:42',
        id: 'v1',
        label: 'V1',
        state: 'ready',
      },
      {
        createdAt: 'Oct 12, 2026 · 14:18',
        id: 'v2',
        label: 'V2',
        state: 'ready',
      },
      {
        createdAt: 'Oct 14, 2026 · 11:05',
        id: 'v3',
        label: 'V3',
        state: 'ready',
      },
    ],
  },
];
