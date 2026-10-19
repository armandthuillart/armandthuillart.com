import { Button } from '@remark/components/ui/Button';
import { Input } from '@remark/components/ui/Input';
import { Pagination, PaginationContent, PaginationItem } from '@remark/components/ui/Pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@remark/components/ui/Select';
import { Skeleton } from '@remark/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@remark/components/ui/Table';
import { ArrowLeft, ArrowRight, Calendar, Funnel } from 'lucide-react';

const SKELETON_IDS = ['sk1', 'sk2', 'sk3', 'sk4', 'sk5'];

export function FeedbacksTableSkeleton() {
  return (
    <div className="container">
      <div className="space-y-4">
        {/* Search and filters */}
        <div className="mb-4 grid grid-cols-1 flex-col gap-3 sm:grid-cols-2 sm:gap-2">
          {/* Search bar */}
          <div className="relative">
            <Input className="peer ps-9" disabled placeholder="Filter by email..." type="text" />
            <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-muted-foreground/80">
              <Funnel size={16} />
            </div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-2 gap-2">
            {/* Time range selector */}
            <div className="group relative">
              <Select disabled>
                <SelectTrigger className="relative ps-9">
                  <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-muted-foreground/80">
                    <Calendar size={16} />
                  </div>
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7-days">Last 7 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Impact selector */}
            <Select disabled>
              <SelectTrigger>
                <SelectValue placeholder="Select impact" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="mb-4 overflow-hidden rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-75.5">From</TableHead>
                <TableHead className="w-32">Impact</TableHead>
                <TableHead className="w-76">Subject</TableHead>
                <TableHead className="w-42.5">Sent</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {SKELETON_IDS.map((id) => (
                <TableRow className="hover:bg-transparent" key={id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-8 rounded-lg" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between gap-3 max-sm:flex-col">
          {/* Page number information */}
          <p className="flex-1 text-sm whitespace-nowrap text-muted-foreground">
            Page <span className="text-foreground">1</span> of{' '}
            <span className="text-foreground">1</span>
          </p>

          {/* Pagination buttons */}
          <div className="grow">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button aria-label="Go to previous page" disabled size="icon" variant="outline">
                    <ArrowLeft size={16} />
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button disabled size="icon" variant="outline">
                    1
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <Button aria-label="Go to next page" disabled size="icon" variant="outline">
                    <ArrowRight size={16} />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>

          {/* Results per page */}
          <div className="flex flex-1 justify-end">
            <Select disabled>
              <SelectTrigger className="w-fit whitespace-nowrap">
                <SelectValue placeholder="Select number of results" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 / page</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
