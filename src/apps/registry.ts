export const appRegistry = {
  crosspost: { label: 'Crosspost' },
  dimsight: { label: 'Dimsight' },
  remark: { label: 'Remark' },
} as const;

export type AppSlug = keyof typeof appRegistry;
