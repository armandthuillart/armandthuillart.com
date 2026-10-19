import type { Contact } from '@remark/lib/contact-schema';
import type { Feedback } from '@remark/lib/feedback-schema';
import type { Vote, SubscriptionSlug } from '@remark/lib/schema';
import { useSyncExternalStore } from 'react';

import type { Passkey } from './types';

interface Database {
  accounts: SocialAccount[];
  billingPortalOpen?: boolean;
  cancelAtPeriodEnd: boolean;
  contacts: Contact[];
  feedbacks: Feedback[];
  keys: LocalKey[];
  passkeys: Passkey[];
  plan: SubscriptionSlug;
  signedIn: boolean;
  user: { email: string; id: string; name: string };
  votes: Vote[];
}
interface LocalKey {
  createdAt: Date;
  id: string;
  key: string;
  lastRequest: Date | null;
  name: string;
  requestCount: number;
  start: string;
}
interface SocialAccount {
  accountId: string;
  createdAt: Date;
  id: string;
  provider: string;
}
const ago = (days: number) => new Date(Date.now() - days * 86400000);
const subjects = [
  'Export takes too long',
  'Add a compact review view',
  'The onboarding is excellent',
  'Button contrast in dark mode',
  'Merge duplicate requests',
  'Keyboard navigation gets stuck',
  'Download fails on mobile',
  'Improve search results',
  'Billing details are missing',
  'Translate the dashboard',
  'Export takes too long',
  'Add a compact review view',
];
const names = [
  'Maya Chen',
  'Thomas Bernard',
  'Ines Garcia',
  'Alex Morgan',
  'Sarah Lee',
  'Julien Martin',
  'Sofia Rossi',
  'Liam Wilson',
  'Emma Brown',
  'Noah Davis',
  'Chloe Dubois',
  'Lucas Petit',
];
function seed(): Database {
  const contacts: Contact[] = names.map((name, index) => ({
    createdAt: ago(index + 10),
    email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`,
    id: `contact-${index + 1}`,
    metadata: { tier: index % 3 ? 'free' : 'plus' },
    name,
    referenceId: 'remark-local',
    updatedAt: ago(index),
  }));
  const feedbacks: Feedback[] = subjects.map((subject, index) => ({
    createdAt: ago(index / 2),
    from: contacts[index].email,
    id: `feedback-${index + 1}`,
    impact: feedbackImpact(index),
    metadata: {
      browser: index % 2 ? 'Safari' : 'Chrome',
      device: index % 2 ? 'mobile' : 'desktop',
      os: index % 2 ? 'iOS' : 'macOS',
      path: '/dashboard/projects',
    },
    subject,
    summary: [`${contacts[index].name} shares feedback about ${subject.toLowerCase()}.`],
    tags: feedbackTags(index),
    text: `${subject}. This is what I noticed while using the product today. It would help our team to improve this experience.`,
    updatedAt: ago(index / 2),
  }));
  const votes: Vote[] = [0, 1, 3, 4, 5, 7].map((index, n) => ({
    browsers: ['Chrome', 'Safari'],
    count: 12 - n,
    createdAt: ago(n / 2),
    description: feedbacks[index].text,
    devices: ['desktop', 'mobile'],
    feedbackIds: [feedbacks[index].id],
    id: `vote-${n + 1}`,
    impact: index % 2 ? 'minor' : 'major',
    operatingSystems: ['macOS', 'iOS'],
    referenceId: 'remark-local',
    status: (['pending', 'reviewing', 'planned', 'in_progress', 'completed', 'closed'] as const)[n],
    tags: feedbacks[index].tags,
    title: subjects[index],
    updatedAt: ago(n / 2),
  }));
  return {
    accounts: [
      {
        accountId: 'remark-local',
        createdAt: ago(30),
        id: 'account-1',
        provider: 'github',
      },
    ],
    cancelAtPeriodEnd: false,
    contacts,
    feedbacks,
    keys: [
      {
        createdAt: ago(15),
        id: 'key-1',
        key: 're_local_demo_key_0000000000000001',
        lastRequest: new Date(),
        name: 'Production',
        requestCount: 18,
        start: 're_local',
      },
    ],
    passkeys: [],
    plan: 'free',
    signedIn: true,
    user: {
      email: 'armand@example.com',
      id: 'remark-local',
      name: 'Armand Thuillart',
    },
    votes,
  };
}
const storageKey = 'remark-playable-v1';
let database = seed();
let loaded = false;
let revision = 0;
const listeners = new Set<() => void>();
export function changeDatabase(change: (database: Database) => void) {
  change(getDatabase());
  database = {
    ...database,
    contacts: [...database.contacts],
    feedbacks: [...database.feedbacks],
    keys: [...database.keys],
    votes: [...database.votes],
  };
  try {
    localStorage.setItem(storageKey, JSON.stringify(database));
  } catch {
    /* Keep working without persistence. */
  }
  revision++;
  for (const listener of listeners) listener();
}
function feedbackImpact(index: number): Feedback['impact'] {
  if (index === 2) return 'positive';
  if (index % 4 === 0) return 'major';
  if (index % 3 === 0) return 'critical';
  return 'minor';
}

function feedbackTags(index: number): Feedback['tags'] {
  if (index === 2) return ['kudos'];
  return index % 2 ? ['feature_request', 'ux'] : ['bug', 'speed'];
}

const dateKeys = new Set(['createdAt', 'lastRequest', 'updatedAt']);

export function getDatabase(): Database {
  if (!loaded && typeof window !== 'undefined') {
    loaded = true;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) database = reviveDatabase(stored);
      database.billingPortalOpen = false;
    } catch {
      /* A fresh in-memory workspace is available when storage is blocked. */
    }
  }
  return database;
}

export function useDatabase() {
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => revision,
    () => 0,
  );
  return getDatabase();
}
function reviveDatabase(stored: string): Database {
  const parsed: unknown = JSON.parse(stored, (key: string, value: unknown) =>
    dateKeys.has(key) && typeof value === 'string' ? new Date(value) : value,
  );
  return parsed as Database;
}
export const getFeedbacks = () => getDatabase().feedbacks;
export const getContacts = () => getDatabase().contacts;
export const getVotes = () => getDatabase().votes;
