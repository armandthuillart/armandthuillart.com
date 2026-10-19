'use client';

import { useQueryState } from '@remark/adapters/query-state';
import { Badge } from '@remark/components/ui/Badge';
// --- Tag and Impact helpers (adapted from feedbacks/_lib/utils) ---
import type { BadgeProps } from '@remark/components/ui/Badge';
import { Button } from '@remark/components/ui/Button';
import { Checkbox } from '@remark/components/ui/Checkbox';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@remark/components/ui/HoverCard';
import { Input } from '@remark/components/ui/Input';
import { Label } from '@remark/components/ui/Label';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  usePagination,
} from '@remark/components/ui/Pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@remark/components/ui/Popover';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@remark/components/ui/Tooltip';
import type { Vote, VoteImpact } from '@remark/lib/schema';
import { type AppColumnDef, features } from '@remark/lib/table';
import { capitalizeFirstLetter, cn } from '@remark/lib/utils';
import { flexRender, type PaginationState, useTable } from '@tanstack/react-table';
import { formatDistance, formatRelative } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Funnel,
  MessageSquare,
  X,
  Braces,
  Bug,
  CreditCard,
  Gauge,
  Heart,
  Languages,
  Lightbulb,
  type LucideIcon,
  PersonStanding,
  Receipt,
  Scale,
  Shield,
  SwatchBook,
  Workflow,
} from 'lucide-react';
import React from 'react';

import { EmptyState } from './EmptyState';

interface ImpactProps {
  description: string;
  label: string;
  tooltipWidth: string;
  variant: BadgeProps['variant'];
}

interface TagProps {
  Icon: LucideIcon;
  label: string;
  variant: BadgeProps['variant'];
}

type VoteTag =
  | 'a11y'
  | 'billing'
  | 'bug'
  | 'compliance'
  | 'dx'
  | 'feature_request'
  | 'i18n'
  | 'kudos'
  | 'pricing'
  | 'security'
  | 'speed'
  | 'ui'
  | 'ux';

function getImpact(impact: VoteImpact): ImpactProps {
  switch (impact) {
    case 'critical':
      return {
        description: 'Needs attention now before it gets worse',
        label: 'Critical',
        tooltipWidth: 'w-24',
        variant: 'destructive',
      };
    case 'major':
      return {
        description: 'Could become serious if not fixed soon',
        label: 'Major',
        tooltipWidth: 'w-24',
        variant: 'warning',
      };
    case 'minor':
      return {
        description: 'Can wait but worth checking soon',
        label: 'Minor',
        tooltipWidth: 'w-24',
        variant: 'secondary',
      };
    default:
      return {
        description: impact,
        label: impact,
        tooltipWidth: 'w-24',
        variant: 'secondary',
      };
  }
}

function getTag(tag: VoteTag): TagProps {
  switch (tag) {
    case 'a11y':
      return {
        Icon: PersonStanding,
        label: 'A11y',
        variant: 'blue',
      };
    case 'billing':
      return {
        Icon: CreditCard,
        label: 'Billing',
        variant: 'green',
      };
    case 'bug':
      return {
        Icon: Bug,
        label: 'Bug',
        variant: 'destructive',
      };
    case 'compliance':
      return {
        Icon: Scale,
        label: 'Compliance',
        variant: 'purple',
      };
    case 'dx':
      return {
        Icon: Braces,
        label: 'DX',
        variant: 'indigo',
      };
    case 'feature_request':
      return {
        Icon: Lightbulb,
        label: 'Feature Request',
        variant: 'yellow',
      };
    case 'i18n':
      return {
        Icon: Languages,
        label: 'i18n',
        variant: 'blue',
      };
    case 'kudos':
      return {
        Icon: Heart,
        label: 'Kudos',
        variant: 'teal',
      };
    case 'pricing':
      return {
        Icon: Receipt,
        label: 'Pricing',
        variant: 'green',
      };
    case 'security':
      return {
        Icon: Shield,
        label: 'Security',
        variant: 'destructive',
      };
    case 'speed':
      return {
        Icon: Gauge,
        label: 'Speed',
        variant: 'blue',
      };
    case 'ui':
      return {
        Icon: SwatchBook,
        label: 'UI',
        variant: 'pink',
      };
    case 'ux':
      return {
        Icon: Workflow,
        label: 'UX',
        variant: 'orange',
      };
    default:
      return {
        Icon: Heart,
        label: tag,
        variant: 'secondary',
      };
  }
}

// --- Helper functions ---
function parsePgArray(str: string): string[] {
  if (!str) return [];
  return str
    .slice(1, -1) // remove {}
    .split(/","|",?/) // split on "," or ,
    .map((s) => s.replaceAll(/^"|"$/g, '')) // remove leading/trailing quotes
    .filter(Boolean);
}

// --- Table columns ---
const columns: AppColumnDef<Vote>[] = [
  {
    accessorKey: 'title',
    cell: ({ row }) => row.original.title,
    header: 'Title',
  },
  {
    accessorKey: 'count',
    cell: ({ row }) => row.original.count,
    header: 'Votes',
  },
  {
    accessorKey: 'impact',
    cell: ({ row }) => {
      const meta = getImpact(row.original.impact);
      return (
        <Tooltip>
          <TooltipTrigger asChild className="cursor-pointer">
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-66 px-2 py-1">{meta.description}</TooltipContent>
        </Tooltip>
      );
    },
    filterFn: (row, columnId, value) => value === 'all' || row.getValue(columnId) === value,
    header: 'Impact',
  },
  {
    accessorKey: 'tags',
    cell: ({ row }) => {
      const tags = Array.isArray(row.original.tags)
        ? row.original.tags
        : parsePgArray(row.original.tags);
      const [firstTag, ...otherTags] = tags;
      const hasMore = otherTags.length > 0;
      return (
        <div className="flex flex-nowrap gap-2">
          {firstTag && (
            <Badge
              className="relative cursor-pointer"
              variant={getTag(firstTag as VoteTag).variant}
            >
              {React.createElement(getTag(firstTag as VoteTag).Icon, { size: 16 })}
              {getTag(firstTag as VoteTag).label}
            </Badge>
          )}
          {hasMore && (
            <HoverCard closeDelay={100} openDelay={0}>
              <HoverCardTrigger asChild>
                <Badge variant="outline">+{otherTags.length}</Badge>
              </HoverCardTrigger>
              <HoverCardContent className="w-fit p-1 shadow-none" side="top">
                <div className="flex flex-wrap gap-1">
                  {otherTags.map((tag) => {
                    const tagMeta = getTag(tag as VoteTag);
                    return (
                      <Badge key={tag} variant={tagMeta.variant}>
                        {React.createElement(tagMeta.Icon, { size: 16 })}
                        {tagMeta.label}
                      </Badge>
                    );
                  })}
                </div>
              </HoverCardContent>
            </HoverCard>
          )}
        </div>
      );
    },
    filterFn: (row, _columnId, values: string[]) =>
      !values.length ||
      values.every((value) =>
        row.original.tags.includes(value as (typeof row.original.tags)[number]),
      ),
    header: 'Tags',
  },
  {
    accessorKey: 'createdAt',
    cell: ({ row }) => (
      <Tooltip>
        <TooltipTrigger className="cursor-pointer underline decoration-muted-foreground underline-offset-5 transition-[text-decoration-color] duration-150 ease-in-out hover:decoration-current">
          {capitalizeFirstLetter(
            formatDistance(row.original.createdAt, new Date(), { addSuffix: true }).replace(
              'about ',
              '',
            ),
          )}
        </TooltipTrigger>
        <TooltipContent>
          {capitalizeFirstLetter(formatRelative(row.original.createdAt, new Date()))}.
        </TooltipContent>
      </Tooltip>
    ),
    filterFn: (row, columnId, value: TimeRange) => {
      const start = getDateFromTimeRange(value);
      return !start || row.getValue<Date>(columnId).getTime() >= start.getTime();
    },
    header: 'Created',
  },
];

type Impact = 'all' | VoteImpact;

// --- Filter types and options ---
type TimeRange = '3-days' | '7-days' | '15-days' | '24-hours' | '30-days' | 'all';

const timeRanges: { label: string; value: TimeRange }[] = [
  {
    label: 'Last 24 hours',
    value: '24-hours',
  },
  {
    label: 'Last 3 days',
    value: '3-days',
  },
  {
    label: 'Last 7 days',
    value: '7-days',
  },
  {
    label: 'Last 15 days',
    value: '15-days',
  },
  {
    label: 'Last 30 days',
    value: '30-days',
  },
  {
    label: 'All time',
    value: 'all',
  },
];

const impacts: { dotBgColor: string; label: string; value: Impact }[] = [
  {
    dotBgColor: 'bg-red-400',
    label: 'Critical',
    value: 'critical',
  },
  {
    dotBgColor: 'bg-amber-400',
    label: 'Major',
    value: 'major',
  },
  {
    dotBgColor: 'bg-muted-foreground',
    label: 'Minor',
    value: 'minor',
  },
  {
    dotBgColor: 'bg-muted',
    label: 'All',
    value: 'all',
  },
];

// --- Pagination helpers ---
type RowsCount = '5-rows' | '10-rows' | '25-rows' | '50-rows';

// --- Main VotesDataTable ---
export function VotesDataTable({ data }: { data: Vote[] }) {
  // State from URL parameters
  const [rowsCount, setRowsCount] = useQueryState<RowsCount>('rows', {
    defaultValue: '5-rows',
    parse: (v) => `${v}-rows` as RowsCount,
    serialize: (v) => (v === '5-rows' ? null : v.replace('-rows', '')),
  });
  const [activePage, setActivePage] = useQueryState<number>('page', {
    defaultValue: 0,
    parse: (v) => Number(v) || 0,
    serialize: (v) => (v === 0 ? null : String(v)),
  });
  const [searchValue] = useQueryState('search', {
    defaultValue: '',
    parse: (v) => v,
    serialize: (v) => v || null,
  });
  const [selectedImpact] = useQueryState<Impact>('impact', {
    defaultValue: 'all',
    parse: (v) => v as Impact,
    serialize: (v) => v,
  });
  const [selectedTimeRange] = useQueryState<TimeRange>('days', {
    defaultValue: '7-days',
    parse: (v) => getTimeRangeFromNumber(Number(v)),
    serialize: (v) => String(getTimeRangeNumber(v)),
  });
  const [selectedTags] = useQueryState<string[]>('tags', {
    defaultValue: [],
    parse: (v) => (v ? v.split(',') : []),
    serialize: (v) => (v.length ? v.join(',') : null),
  });
  // Memoize table meta
  const tableMeta = React.useMemo(
    () => ({
      pageIndex: activePage,
      pageSize: getRowsCountNumber(rowsCount),
    }),
    [rowsCount, activePage],
  );
  // Filtered data
  const filteredData = data.filter((item) => {
    if (selectedImpact !== 'all' && item.impact !== selectedImpact) return false;
    const startDate = getDateFromTimeRange(selectedTimeRange);
    if (startDate && item.createdAt.getTime() < startDate.getTime()) return false;
    if (searchValue && !item.title.toLowerCase().includes(searchValue.toLowerCase())) return false;
    if (selectedTags.length > 0) {
      const itemTags = typeof item.tags === 'string' ? parsePgArray(item.tags) : item.tags;
      if (!selectedTags.every((tag) => itemTags.includes(tag))) return false;
    }
    return true;
  });
  // Pagination
  const startIndex = tableMeta.pageIndex * tableMeta.pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + tableMeta.pageSize);
  const pagesCount = Math.max(1, Math.ceil(filteredData.length / tableMeta.pageSize));
  const currentPage = Math.min(tableMeta.pageIndex + 1, pagesCount);
  const canPreviousPage = tableMeta.pageIndex > 0;
  const canNextPage = startIndex + tableMeta.pageSize < filteredData.length;
  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage,
    paginationItemsToDisplay: 5,
    totalPages: pagesCount,
  });
  const hasRows = data.length > 0;
  const hasFilter = selectedTimeRange !== '7-days' || selectedImpact !== 'all';
  const hasSearchQuery = searchValue !== '';

  // Table instance
  const table = useTable({
    columns,
    data: paginatedData,
    enableColumnFilters: true,
    features,
    manualPagination: true,
    onPaginationChange: (updater) => {
      const newPagination: PaginationState =
        typeof updater === 'function'
          ? updater({
              pageIndex: tableMeta.pageIndex,
              pageSize: tableMeta.pageSize,
            })
          : updater;
      void setActivePage(newPagination.pageIndex);
      if (newPagination.pageSize !== tableMeta.pageSize) {
        const newRowsCount = `${newPagination.pageSize}-rows` as RowsCount;
        if (['5-rows', '10-rows', '25-rows', '50-rows'].includes(newRowsCount)) {
          void setRowsCount(newRowsCount);
        }
      }
    },
    state: {
      columnFilters: [
        {
          id: 'impact',
          value: selectedImpact,
        },
        {
          id: 'createdAt',
          value: selectedTimeRange,
        },
        {
          id: 'tags',
          value: selectedTags,
        },
      ],
      globalFilter: searchValue,
      pagination: {
        pageIndex: tableMeta.pageIndex,
        pageSize: tableMeta.pageSize,
      },
    },
  });

  if (!hasRows && !hasFilter && !hasSearchQuery) {
    return (
      <div className="container">
        <EmptyState
          description="Any sent votes will appear here once received."
          icons={[MessageSquare, MessageSquare, MessageSquare]}
          title="You have not received any votes yet"
        />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="flex flex-col gap-4">
        <SearchAndFilters data={data} />
        {/* Table */}
        <div className="w-full overflow-hidden">
          <div className="mb-4 rounded-md border bg-background">
            <Table className="shrink-0">
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow className="hover:bg-transparent" key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <TableHead className={cn('text-muted-foreground')} key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 && (
                  <TableRow>
                    <TableCell
                      className="h-24 text-center text-muted-foreground"
                      colSpan={columns.length}
                    >
                      {searchValue ? (
                        <>
                          No results found for: &quot;
                          <span className="text-foreground">{searchValue}</span>
                          &quot;.
                        </>
                      ) : (
                        'No results found.'
                      )}
                    </TableCell>
                  </TableRow>
                )}
                {table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-between gap-3 max-sm:flex-col">
            {/* Page number information */}
            <p
              aria-live="polite"
              className="flex-1 text-sm whitespace-nowrap text-muted-foreground"
            >
              Page <span className="text-foreground">{currentPage}</span> of{' '}
              <span className="text-foreground">{pagesCount}</span>
            </p>
            {/* Pagination buttons */}
            <div className="grow">
              <Pagination>
                <PaginationContent>
                  {/* Previous page button */}
                  <PaginationItem>
                    <Button
                      aria-label="Go to previous page"
                      className="disabled:pointer-events-none disabled:opacity-50"
                      disabled={!canPreviousPage}
                      onClick={() => {
                        if (canPreviousPage) {
                          table.previousPage();
                        }
                      }}
                      size="icon"
                      variant="outline"
                    >
                      <ArrowLeft size={16} />
                    </Button>
                  </PaginationItem>
                  {/* Left ellipsis (...) */}
                  {showLeftEllipsis && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  {/* Page number buttons */}
                  {pages.map((page) => {
                    const isActive = page === currentPage;
                    return (
                      <PaginationItem key={page}>
                        <Button
                          aria-current={isActive ? 'page' : undefined}
                          onClick={() => {
                            table.setPageIndex(page - 1);
                          }}
                          size="icon"
                          variant={`${isActive ? 'outline' : 'ghost'}`}
                        >
                          {page}
                        </Button>
                      </PaginationItem>
                    );
                  })}
                  {/* Right ellipsis (...) */}
                  {showRightEllipsis && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  {/* Next page button */}
                  <PaginationItem>
                    <Button
                      aria-label="Go to next page"
                      className="disabled:pointer-events-none disabled:opacity-50"
                      disabled={!canNextPage}
                      onClick={() => {
                        if (canNextPage) {
                          table.nextPage();
                        }
                      }}
                      size="icon"
                      variant="outline"
                    >
                      <ArrowRight size={16} />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
            {/* Results per page */}
            <div className="flex flex-1 justify-end">
              <Select
                aria-label="Results per page"
                onValueChange={(value) => {
                  table.setPageSize(Number(value));
                }}
                value={String(tableMeta.pageSize)}
              >
                <SelectTrigger className="w-fit whitespace-nowrap" id="results-per-page">
                  <SelectValue placeholder="Select number of results" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 25, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={String(pageSize)}>
                      {pageSize} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getDateFromTimeRange(timeRange: TimeRange): Date | null {
  const now = new Date();
  const hoursInMs = 60 * 60 * 1000;
  switch (timeRange) {
    case '3-days':
      return new Date(now.getTime() - 3 * 24 * hoursInMs);
    case '7-days':
      return new Date(now.getTime() - 7 * 24 * hoursInMs);
    case '15-days':
      return new Date(now.getTime() - 15 * 24 * hoursInMs);
    case '24-hours':
      return new Date(now.getTime() - 24 * hoursInMs);
    case '30-days':
      return new Date(now.getTime() - 30 * 24 * hoursInMs);
    case 'all':
      return null;
    default:
      return null;
  }
}

function getRowsCountNumber(rowsCount: RowsCount) {
  switch (rowsCount) {
    case '5-rows':
      return 5;
    case '10-rows':
      return 10;
    case '25-rows':
      return 25;
    case '50-rows':
      return 50;
  }
}

function getTimeRangeFromNumber(number: number): TimeRange {
  switch (number) {
    case 1:
      return '24-hours';
    case 3:
      return '3-days';
    case 7:
      return '7-days';
    case 15:
      return '15-days';
    case 30:
      return '30-days';
    default:
      return 'all';
  }
}

function getTimeRangeNumber(timeRange: TimeRange) {
  switch (timeRange) {
    case '3-days':
      return 3;
    case '7-days':
      return 7;
    case '15-days':
      return 15;
    case '24-hours':
      return 1;
    case '30-days':
      return 30;
    case 'all':
      return 0;
  }
}

// --- Search and Filters component ---
function SearchAndFilters({ data }: { data: Vote[] }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const id = React.useId();

  const [search, setSearch] = useQueryState('search', {
    defaultValue: '',
    parse: (v) => v,
    serialize: (v) => v || null,
  });

  function handleSearchClear() {
    void setSearch('');
    inputRef.current?.focus();
  }

  const [timeRange, setTimeRange] = useQueryState<TimeRange>('days', {
    defaultValue: '7-days',
    parse: (v) => getTimeRangeFromNumber(Number(v)),
    serialize: (v) => String(getTimeRangeNumber(v)),
  });

  const [impact, setImpact] = useQueryState<Impact>('impact', {
    defaultValue: 'all',
    parse: (v) => v as Impact,
    serialize: (v) => v,
  });

  const [selectedTags, setSelectedTags] = useQueryState<string[]>('tags', {
    defaultValue: [],
    parse: (v) => (v ? v.split(',') : []),
    serialize: (v) => (v.length ? v.join(',') : null),
  });

  // Get unique tags from data
  const uniqueTags = React.useMemo(() => {
    const tags = new Set<string>();
    for (const item of data) {
      if (typeof item.tags === 'string') {
        for (const tag of parsePgArray(item.tags)) tags.add(tag);
      } else if (Array.isArray(item.tags)) {
        for (const tag of item.tags) tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  }, [data]);

  // Get tag counts
  const tagCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of data) {
      const tags = typeof item.tags === 'string' ? parsePgArray(item.tags) : item.tags;
      for (const tag of tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return counts;
  }, [data]);

  const handleTagChange = (checked: boolean, value: string) => {
    const newTags = checked
      ? [...selectedTags, value]
      : selectedTags.filter((tag) => tag !== value);
    void setSelectedTags(newTags);
  };

  const hasSelectedTags = selectedTags.length > 0;

  return (
    <div className="mb-4 grid grid-cols-1 flex-col gap-3 sm:grid-cols-2 sm:gap-2">
      {/* Search bar */}
      <div className="relative">
        <Input
          className="peer ps-9"
          onChange={(e) => {
            void setSearch(e.target.value);
          }}
          placeholder="Filter by title..."
          ref={inputRef}
          type="text"
          value={search}
        />
        <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          <Funnel size={16} />
        </div>
        {Boolean(search) && (
          <button
            aria-label="Clear filter"
            className="focus-visible:border-ring focus-visible:ring-ring/50 absolute inset-y-0 inset-e-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 transition-[color,box-shadow] outline-none hover:text-foreground focus:z-10 focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            onClick={handleSearchClear}
          >
            <X size={16} />
          </button>
        )}
      </div>
      {/* Filters */}
      <div className="grid grid-cols-3 gap-2">
        {/* Time range selector */}
        <div className="group relative">
          <Select
            onValueChange={(value: TimeRange) => {
              void setTimeRange(value);
            }}
            value={timeRange}
          >
            <SelectTrigger className="relative ps-9">
              <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-muted-foreground/80 group-has-[select[disabled]]:opacity-50">
                <Calendar size={16} />
              </div>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeRanges.map(({ label, value }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* Tag filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button className="justify-between" variant="outline">
              <div className="flex items-center gap-2">
                <Funnel className="-ms-1 opacity-60" size={16} />
                Tags
              </div>
              {hasSelectedTags && (
                <span className="-me-1 inline-flex h-5 max-h-full w-4.5 items-center justify-center rounded border bg-background px-1 font-[inherit] text-[0.625rem] font-medium text-muted-foreground/70">
                  {selectedTags.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-39 p-3">
            <div className="space-y-3">
              <div className="text-xs font-medium text-muted-foreground">Filter by tags</div>
              <div className="space-y-3">
                {uniqueTags.map((tag, i) => {
                  const tagMeta = getTag(tag as VoteTag);
                  return (
                    <div className="flex items-center gap-2" key={tag}>
                      <Checkbox
                        checked={selectedTags.includes(tag)}
                        id={`${id}-tag-${i}`}
                        onCheckedChange={(checked: boolean) => {
                          handleTagChange(checked, tag);
                        }}
                      />
                      <Label
                        className="flex grow justify-between gap-2 font-normal"
                        htmlFor={`${id}-tag-${i}`}
                      >
                        {tagMeta.label}
                        <span className="ms-2 text-xs text-muted-foreground">
                          {tagCounts.get(tag)}
                        </span>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {/* Impact selector */}
        <Select
          onValueChange={(value: Impact) => {
            void setImpact(value);
          }}
          value={impact}
        >
          <SelectTrigger className="[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0">
            <SelectValue placeholder="Select impact" />
          </SelectTrigger>
          <SelectContent className="[&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8 [&_*[role=option]>span]:inset-s-auto [&_*[role=option]>span]:inset-e-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span>svg]:text-muted-foreground/80">
            {impacts.map(({ dotBgColor, label, value }) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <div className={cn('size-2 rounded-full', dotBgColor)} />
                  <span className="truncate">{label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
