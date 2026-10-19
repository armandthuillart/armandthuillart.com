'use client';

import Link from '@remark/adapters/link';
import { useQueryState } from '@remark/adapters/query-state';
import { Badge } from '@remark/components/ui/Badge';
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
import { APP_NAME } from '@remark/lib/constants';
import type { Feedback } from '@remark/lib/feedback-schema';
import { getImpact, getTag } from '@remark/lib/feedback-utils';
import type { FeedbackImpact, FeedbackTag } from '@remark/lib/schema';
import { type AppColumnDef, features } from '@remark/lib/table';
import { capitalizeFirstLetter, cn } from '@remark/lib/utils';
import { flexRender, type PaginationState, useTable } from '@tanstack/react-table';
import { formatDistance, formatRelative } from 'date-fns';
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Funnel,
  MessageSquare,
  X,
} from 'lucide-react';
import React from 'react';

import { EmptyState } from './EmptyState';
import { PageIcon } from './PageIcon';
import { TextShimmer } from './TextShimmer';

// 1. Columns definition
const columns: AppColumnDef<Feedback>[] = [
  {
    accessorKey: 'from',
    cell: ({ row }) => {
      return (
        <Link className="group/link flex items-center gap-3" href={`/feedbacks/${row.original.id}`}>
          <PageIcon Icon={MessageSquare} size="md" />
          <span className="pr-4.5 whitespace-nowrap underline decoration-muted-foreground underline-offset-5 transition-[color,text-decoration-color] duration-150 ease-in-out group-hover/link:decoration-current">
            {row.original.from}
            <ArrowUpRight className="group-hover/link:text-primary absolute mt-1.25 inline-block size-[1em] text-muted-foreground no-underline transition duration-[inherit] ease-[inherit] group-hover/link:translate-x-px group-hover/link:-translate-y-px" />
          </span>
        </Link>
      );
    },
    header: 'From',
  },
  {
    accessorKey: 'impact',
    cell: ({ row }) => {
      return (
        <Tooltip>
          <TooltipTrigger asChild className="cursor-pointer">
            <Badge variant={getImpact(row.original.impact).variant}>
              {getImpact(row.original.impact).label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-66 px-2 py-1">
            <TextShimmer>{`${APP_NAME} AI`}</TextShimmer>{' '}
            {getImpact(row.original.impact).description}
          </TooltipContent>
        </Tooltip>
      );
    },
    filterFn: (row, columnId, value) => value === 'all' || row.getValue(columnId) === value,
    header: 'Impact',
  },
  {
    accessorKey: 'tags',
    cell: ({ row }) => {
      let tags: string[] = [];

      if (typeof row.original.tags === 'string') {
        tags = parsePgArray(row.original.tags);
      } else if (Array.isArray(row.original.tags)) {
        tags = row.original.tags;
      }

      const [firstTag, ...otherTags] = tags;
      const hasMore = otherTags.length > 0;

      return (
        <div className="flex flex-nowrap gap-2">
          {firstTag && (
            <Badge
              className="relative cursor-pointer"
              variant={getTag(firstTag as FeedbackTag).variant}
            >
              {React.createElement(getTag(firstTag as FeedbackTag).Icon, { size: 16 })}
              {getTag(firstTag as FeedbackTag).label}
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
                    const tagMeta = getTag(tag as FeedbackTag);
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
    accessorKey: 'subject',
    header: 'Subject',
  },
  {
    accessorKey: 'createdAt',
    cell: ({ row }) => {
      return (
        <Tooltip>
          <TooltipTrigger className="cursor-pointer underline decoration-muted-foreground underline-offset-5 transition-[text-decoration-color] duration-150 ease-in-out hover:decoration-current">
            {/* A nice-to-read date & time */}
            {capitalizeFirstLetter(
              formatDistance(row.original.createdAt, new Date(), { addSuffix: true }).replace(
                'about ',
                '',
              ),
            )}
          </TooltipTrigger>
          <TooltipContent>
            {/* The exact date & time */}
            {capitalizeFirstLetter(formatRelative(row.original.createdAt, new Date()))}.
          </TooltipContent>
        </Tooltip>
      );
    },
    filterFn: (row, columnId, value: TimeRange) => {
      const start = getDateFromTimeRange(value);
      return !start || row.getValue<Date>(columnId).getTime() >= start.getTime();
    },
    header: 'Sent',
  },
];

type Impact = 'all' | FeedbackImpact;

type TimeRange = '3-days' | '7-days' | '15-days' | '24-hours' | '30-days' | 'all';

const timeRanges: {
  label: string;
  value: TimeRange;
}[] = [
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

const impacts: {
  dotBgColor: string;
  label: string;
  value: Impact;
}[] = [
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

type RowsCount = '5-rows' | '10-rows' | '25-rows' | '50-rows';

export function FeedbacksDataTable({ data }: { data: Feedback[] }) {
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

  // Prevent recreating the table instance when URL parameters change
  // by memoizing it with a stable reference
  const tableMeta = React.useMemo(
    () => ({
      pageIndex: activePage,
      pageSize: getRowsCountNumber(rowsCount),
    }),
    [rowsCount, activePage],
  );

  const table = useTable({
    columns,
    data,
    enableColumnFilters: true,
    features,
    manualPagination: false, // Important: manually control pagination
    onPaginationChange: (updater) => {
      const newPagination: PaginationState =
        typeof updater === 'function'
          ? updater({
              pageIndex: tableMeta.pageIndex,
              pageSize: tableMeta.pageSize,
            })
          : updater;

      // Update the URL query parameter first
      void setActivePage(newPagination.pageIndex);

      // If page size changed, update the rows count parameter
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

  // Get filtered data based on current filters
  const filteredData = data.filter((item) => {
    // Filter by impact
    if (selectedImpact !== 'all' && item.impact !== selectedImpact) {
      return false;
    }

    // Filter by time range
    const startDate = getDateFromTimeRange(selectedTimeRange);
    if (startDate && item.createdAt.getTime() < startDate.getTime()) {
      return false;
    }

    // Filter by search term
    if (searchValue && !item.from.toLowerCase().includes(searchValue.toLowerCase())) {
      return false;
    }

    // Filter by tags
    if (selectedTags.length > 0) {
      const itemTags = typeof item.tags === 'string' ? parsePgArray(item.tags) : item.tags;
      if (!selectedTags.every((tag) => itemTags.includes(tag))) {
        return false;
      }
    }

    return true;
  });

  // Reset to first page when filters change if current page would be out of bounds
  // Move useEffect before any conditional rendering to avoid React Hook warnings
  React.useEffect(() => {
    const maxPageIndex = Math.max(0, Math.ceil(filteredData.length / tableMeta.pageSize) - 1);
    if (tableMeta.pageIndex > maxPageIndex) {
      // Current page is now out of bounds due to filtering
      void setActivePage(0);
    }
  }, [
    selectedImpact,
    selectedTimeRange,
    searchValue,
    selectedTags,
    filteredData.length,
    tableMeta,
    setActivePage,
  ]);

  // Manually handle pagination
  const startIndex = tableMeta.pageIndex * tableMeta.pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + tableMeta.pageSize);

  // Calculate accurate pagination information based on filtered data
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

  if (!hasRows && !hasFilter && !hasSearchQuery) {
    return (
      <div className="container">
        <EmptyState
          description="Any sent feedback will appear here once received."
          icons={[MessageSquare, MessageSquare, MessageSquare]}
          title="You have not received any feedbacks yet"
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
                    {headerGroup.headers.map((header) => {
                      return (
                        <TableHead className={cn('text-muted-foreground')} key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(header.column.columnDef.header, header.getContext())}
                        </TableHead>
                      );
                    })}
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

                {paginatedData.length > 0 &&
                  table.getRowModel().rows.map((tableRow) => (
                    <TableRow key={tableRow.id}>
                      {tableRow.getVisibleCells().map((cell) => (
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

function parsePgArray(str: string): string[] {
  if (!str) return [];
  return str
    .slice(1, -1) // remove {}
    .split(/","|",?/) // split on "," or ,
    .map((s) => s.replaceAll(/^"|"$/g, '')) // remove leading/trailing quotes
    .filter(Boolean);
}

function SearchAndFilters({ data }: { data: Feedback[] }) {
  // Search-related code
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

  // Filters-related code
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
          placeholder="Filter by email..."
          ref={inputRef}
          type="text"
          value={search}
        />

        {/* Decorative icon */}
        <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          <Funnel size={16} />
        </div>

        {/* Clear button */}
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
                  const tagMeta = getTag(tag as FeedbackTag);
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
