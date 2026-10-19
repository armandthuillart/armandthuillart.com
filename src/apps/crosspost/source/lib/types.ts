import type { ReactNode } from 'react';

import type { UIMessage } from '../local/runtime';
export interface LegalDocument {
  id: string;
  body: ReactNode;
  title: string;
  description: string | undefined;
}
export type MyMessage = UIMessage;
export type Platform = 'x' | 'bluesky' | 'mastodon' | 'linkedin' | 'threads';
export type TextUIPart = { type: 'text'; text: string };
export interface User {
  id: string;
  tier: Tier;
  email: string;
  lastName?: string;
  firstName: string;
}
type ThemeColor = 'default' | 'green' | 'blue' | 'pink' | 'orange';
type Tier = 'anonymous' | 'free' | 'pro';
