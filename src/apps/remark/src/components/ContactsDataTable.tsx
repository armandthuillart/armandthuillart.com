'use client';

import { useQueryState } from '@remark/adapters/query-state';
import { Button } from '@remark/components/ui/Button';
import { Input } from '@remark/components/ui/Input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from '@remark/components/ui/Pagination';
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
import type { Contact } from '@remark/lib/contact-schema';
import { type AppColumnDef, features } from '@remark/lib/table';
import { flexRender, useTable } from '@tanstack/react-table';
import { formatDistance } from 'date-fns';
import { ArrowLeft, ArrowRight, Funnel, X } from 'lucide-react';
import React from 'react';

const columns: AppColumnDef<Contact>[] = [
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'metadata.tier',
    cell: ({ row }) => {
      const tier = row.original.metadata?.tier;
      return tier ?? 'Free';
    },
    header: 'Tier',
  },
  {
    accessorKey: 'updatedAt',
    cell: ({ row }) => {
      const updatedAt = row.original.updatedAt;

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <time dateTime={updatedAt.toISOString()}>
              {formatDistance(updatedAt, new Date(), { addSuffix: true })}
            </time>
          </TooltipTrigger>
          <TooltipContent>
            {updatedAt.toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </TooltipContent>
        </Tooltip>
      );
    },
    header: 'Updated At',
  },
  {
    accessorKey: 'createdAt',
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;

      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <time dateTime={createdAt.toISOString()}>
              {formatDistance(createdAt, new Date(), { addSuffix: true })}
            </time>
          </TooltipTrigger>
          <TooltipContent>
            {createdAt.toLocaleString('en-US', {
              dateStyle: 'medium',
              timeStyle: 'short',
            })}
          </TooltipContent>
        </Tooltip>
      );
    },
    header: 'Created At',
  },
];

type PaginationItem = 'dots' | number;

export function ContactsDataTable({ data }: { data: Contact[] }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [search, setSearch] = useQueryState('search');
  const [page, setPage] = useQueryState('page', { defaultValue: '1' });
  const [rowsCount, setRowsCount] = useQueryState('count', { defaultValue: '10' });

  const currentPage = page ? Number.parseInt(page, 10) : 1;
  const pageSize = rowsCount ? Number.parseInt(rowsCount, 10) : 10;
  const pageIndex = currentPage - 1;

  const handleSearchClear = () => {
    void setSearch(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const table = useTable({
    columns,
    data,
    features,
    onGlobalFilterChange: (value: unknown) => {
      void setSearch(typeof value === 'string' ? value : null);
    },
    state: {
      globalFilter: search ?? '',
      pagination: {
        pageIndex,
        pageSize,
      },
    },
  });

  const totalPages = table.getPageCount();

  // Generate pagination range
  const paginationItems = generatePaginationItems(currentPage, totalPages);

  return (
    <>
      <div className="space-y-4">
        <div className="relative">
          <Input
            className="peer ps-9"
            onChange={(e) => {
              void setSearch(e.target.value || null);
            }}
            placeholder="Filter by email..."
            ref={inputRef}
            type="text"
            value={search ?? ''}
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
              <X aria-hidden="true" size={16} />
            </button>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow className="hover:bg-transparent" key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead className="text-muted-foreground" key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    className="hover:bg-transparent"
                    data-state={row.getIsSelected() && 'selected'}
                    key={row.id}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    className="h-24 text-center text-muted-foreground"
                    colSpan={columns.length}
                  >
                    {search ? (
                      <>
                        No results found for: &quot;
                        <span className="text-foreground">{search}</span>
                        &quot;.
                      </>
                    ) : (
                      'No results found.'
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 max-sm:flex-col">
          {/* Page number information */}
          <p aria-live="polite" className="flex-1 text-sm whitespace-nowrap text-muted-foreground">
            Page <span className="text-foreground">{currentPage}</span> of{' '}
            <span className="text-foreground">{totalPages}</span>
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
                    disabled={currentPage <= 1}
                    onClick={() => {
                      if (currentPage > 1) {
                        void setPage((currentPage - 1).toString());
                      }
                    }}
                    size="icon"
                    variant="outline"
                  >
                    <ArrowLeft size={16} />
                  </Button>
                </PaginationItem>

                {/* Page number buttons */}
                {paginationItems.map((pageNumber, i) => {
                  if (pageNumber === 'dots') {
                    return (
                      <PaginationItem key={`dots-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }

                  const isActive = pageNumber === currentPage;
                  return (
                    <PaginationItem key={`page-${pageNumber}`}>
                      <Button
                        aria-current={isActive ? 'page' : undefined}
                        onClick={() => {
                          void setPage(pageNumber.toString());
                        }}
                        size="icon"
                        variant={`${isActive ? 'outline' : 'ghost'}`}
                      >
                        {pageNumber}
                      </Button>
                    </PaginationItem>
                  );
                })}

                {/* Next page button */}
                <PaginationItem>
                  <Button
                    aria-label="Go to next page"
                    className="disabled:pointer-events-none disabled:opacity-50"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      if (currentPage < totalPages) {
                        void setPage((currentPage + 1).toString());
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
                void setRowsCount(value);
              }}
              value={rowsCount}
            >
              <SelectTrigger className="w-fit whitespace-nowrap" id="results-per-page">
                <SelectValue placeholder="Select number of results" />
              </SelectTrigger>

              <SelectContent>
                {[10, 20, 50, 100].map((pageSize) => (
                  <SelectItem key={pageSize} value={pageSize.toString()}>
                    {pageSize} / page
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </>
  );
}

// Function to generate pagination items
function generatePaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  const delta = 1; // Number of pages to show before and after current page
  const items: PaginationItem[] = [];

  // Always include first page
  items.push(1);

  // Calculate range of pages to display
  const rangeStart = Math.max(2, currentPage - delta);
  const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

  // Add dots if there is a gap after first page
  if (rangeStart > 2) {
    items.push('dots');
  }

  // Add range of pages
  for (let i = rangeStart; i <= rangeEnd; i++) {
    items.push(i);
  }

  // Add dots if there is a gap before last page
  if (rangeEnd < totalPages - 1) {
    items.push('dots');
  }

  // Always include last page if it exists
  if (totalPages > 1) {
    items.push(totalPages);
  }

  return items;
}
