'use client';

import { Badge } from '@remark/components/ui/Badge';
import { Button } from '@remark/components/ui/Button';
import { Checkbox } from '@remark/components/ui/Checkbox';
import { Input } from '@remark/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@remark/components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@remark/components/ui/Table';
import { getImpact, getTag } from '@remark/lib/feedback-utils';
import type { FeedbackImpact, FeedbackTag } from '@remark/lib/schema';
import { capitalizeFirstLetter, cn } from '@remark/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { AtSign, Clock, Funnel } from 'lucide-react';
import { type Transition, type Variants, motion } from 'motion/react';
import React from 'react';

interface Tab {
  description: string;
  id: number;
  title: string;
}

const tabs: Tab[] = [
  {
    description: "See who's asking for what.",
    id: 1,
    title: 'Analyze',
  },
  {
    description: 'Most asked features come first.',
    id: 2,
    title: 'Prioritize',
  },
];

const gridVariants: Variants = {
  one: { gridTemplateColumns: '6fr 4fr' },
  two: { gridTemplateColumns: '4fr 6fr' },
};

const gridTransition: Transition = {
  bounce: 0,
  duration: 0.4,
  type: 'spring',
};

const paragraphVariants: Variants = {
  one: {
    opacity: 0,
    y: -6,
  },
  two: {
    opacity: 1,
    y: 0,
  },
};

const rowVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: (i: number) => ({
    opacity: 1,
    transition: {
      delay: i * 0.06,
      duration: 0.32,
      ease: [0.33, 1, 0.68, 1] as const,
    },
    y: 0,
  }),
};

export function DemoTabs() {
  const [tab, setTab] = React.useState<Tab['id']>(1);

  function handleClick(id: Tab['id']) {
    if (id === tab) return;
    setTab(id);
  }

  return (
    <>
      <div className="relative mb-12 h-56 w-full pt-6 pb-0 md:h-112">
        <div className="relative size-full overflow-hidden rounded-2xl border bg-background p-4 after:pointer-events-none after:absolute after:inset-0 after:top-auto after:h-2/3 after:bg-linear-to-t after:from-background after:to-transparent md:p-6 md:pb-0">
          {/* Desktop */}
          <div className="relative size-full rounded-2xl rounded-t-lg rounded-b-none border-b-0 shadow-xs md:border md:px-6 md:pt-8 lg:px-12 lg:pt-16">
            <SearchAndFilters />
            <div className="mb-4 size-full rounded-t-md border border-b-0 bg-background">
              <DataTable selectedTabId={tab} />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-hidden">
        <motion.div
          animate={tab === 1 ? 'one' : 'two'}
          className="grid grid-cols-[6fr_4fr] gap-12 md:px-6"
          layout="preserve-aspect"
          transition={gridTransition}
          variants={gridVariants}
        >
          {tabs.map(({ description, id, title }) => (
            <button
              className="flex cursor-pointer flex-col gap-4 text-start focus-visible:outline-none"
              key={title}
              onClick={() => {
                handleClick(id);
              }}
              type="button"
            >
              <hr
                className={cn(
                  'border-primary rounded-full border-t-3 transition-colors duration-200 ease-in-out',
                  { 'border-muted-foreground': id !== tab },
                )}
              />

              <h3
                className={cn(
                  'text-2xl/8 font-semibold tracking-tight transition-colors duration-200 ease-in-out',
                  { 'text-muted-foreground': id !== tab },
                )}
              >
                {title}
              </h3>

              <motion.p
                animate={tab === id ? 'two' : 'one'}
                className="text-muted-foreground"
                initial={{ opacity: tab === id ? 1 : 0 }}
                transition={{
                  delay: tab === id ? 0.4 : 0,
                  duration: 0.15,
                }}
                variants={paragraphVariants}
              >
                {description}
              </motion.p>
            </button>
          ))}
        </motion.div>
      </div>
    </>
  );
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function hoursAgo(hours: number): Date {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date;
}

function SearchAndFilters() {
  return (
    <div className="mb-4 hidden grid-cols-1 flex-col gap-3 md:grid md:grid-cols-2 md:gap-2">
      <div className="relative">
        <Input
          className="peer pointer-events-none ps-9"
          placeholder="Filter by email..."
          type="email"
        />

        <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          <AtSign size={16} />
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-2">
        <div className="group relative">
          <Select defaultValue="1">
            <SelectTrigger aria-label="Select time" className="pointer-events-none relative ps-9">
              <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-muted-foreground/80 group-has-[select[disabled]]:opacity-50">
                <Clock size={16} />
              </div>
              <SelectValue placeholder="Select time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 7 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="group relative">
          <Button className="pointer-events-none w-full justify-between pl-3" variant="outline">
            <div className="flex items-center gap-2">
              <Funnel className="text-muted-foreground/80" size={16} />
              Filters
            </div>
            <span className="-me-1 inline-flex size-4.5 max-h-full items-center justify-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
              2
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}

const feedbacks: {
  from: string;
  impact: FeedbackImpact;
  sent: Date;
  subject: string;
  tags: FeedbackTag[];
}[] = [
  {
    from: 'alan@turing.com',
    impact: 'critical',
    sent: hoursAgo(1),
    subject: "Can't upgrade plan",
    tags: ['bug'],
  },
  {
    from: 'marie@curry.com',
    impact: 'minor',
    sent: hoursAgo(4),
    subject: 'Home page footer typo',
    tags: ['ui'],
  },
  {
    from: 'nikola@tesla.com',
    impact: 'major',
    sent: daysAgo(1),
    subject: 'Unclear Next.js docs',
    tags: ['dx'],
  },
  {
    from: 'isaac@newton.com',
    impact: 'positive',
    sent: daysAgo(2),
    subject: 'Love the new UI',
    tags: ['kudos'],
  },
  {
    from: 'louis@pasteur.com',
    impact: 'critical',
    sent: daysAgo(3),
    subject: 'Invoice inquiry',
    tags: ['billing'],
  },
];

const votes = [
  {
    createdAt: daysAgo(1),
    request: 'Add dark mode support',
    votes: 187,
  },
  {
    createdAt: daysAgo(2),
    request: 'Share feedback with a friend',
    votes: 142,
  },
  {
    createdAt: daysAgo(3),
    request: 'Export data to CSV',
    votes: 119,
  },
  {
    createdAt: daysAgo(4),
    request: 'Get notified when a new feature is released',
    votes: 97,
  },
  {
    createdAt: daysAgo(5),
    request: 'Google Sheets integration',
    votes: 76,
  },
];

function DataTable({ selectedTabId }: { selectedTabId: Tab['id'] }) {
  const rows = selectedTabId === 1 ? feedbacks : votes;
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="border-b transition-colors hover:bg-transparent data-[state=selected]:bg-muted">
            <TableHead className="h-12 w-10">
              <Checkbox aria-label="Select all" className="pointer-events-none" />
            </TableHead>
            {selectedTabId === 1 && (
              <>
                <TableHead className="h-12">From</TableHead>
                <TableHead className="h-12">Impact</TableHead>
                <TableHead className="h-12">Subject</TableHead>
                <TableHead className="h-12">Tags</TableHead>
                <TableHead className="h-12">Sent</TableHead>
              </>
            )}
            {selectedTabId === 2 && (
              <>
                <TableHead className="h-12">Request</TableHead>
                <TableHead className="h-12 text-center">Votes</TableHead>
                <TableHead className="h-12">Created</TableHead>
              </>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <motion.tr
              animate="visible"
              className={
                'border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted'
              }
              custom={i}
              initial="hidden"
              key={'from' in row ? row.from : row.request}
              variants={rowVariants}
            >
              <TableCell>
                <Checkbox aria-label="Select row" className="pointer-events-none" />
              </TableCell>
              {'from' in row ? (
                <>
                  <TableCell>{row.from}</TableCell>
                  <TableCell>
                    <Badge variant={getImpact(row.impact).variant}>
                      {getImpact(row.impact).label}
                    </Badge>
                  </TableCell>
                  <TableCell>{row.subject}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {row.tags.map((tag) => {
                        const tagMeta = getTag(tag);
                        return (
                          <Badge key={tag} variant={tagMeta.variant}>
                            {React.createElement(tagMeta.Icon, { size: 16 })}
                            {tagMeta.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    {capitalizeFirstLetter(formatDistanceToNow(row.sent, { addSuffix: true }))}
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell>{row.request}</TableCell>
                  <TableCell className="text-center">{row.votes}</TableCell>
                  <TableCell>
                    {capitalizeFirstLetter(formatDistanceToNow(row.createdAt, { addSuffix: true }))}
                  </TableCell>
                </>
              )}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
