import { Input } from '@remark/components/ui/Input';
import { Skeleton } from '@remark/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@remark/components/ui/Table';
import { Funnel } from 'lucide-react';

export function ContactsTableSkeleton() {
  return (
    <>
      {/* Insights grid */}
      <div className="mb-8 grid w-full grid-cols-2 justify-between gap-y-4 pt-12 pb-4 md:grid-cols-4">
        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground uppercase">All contacts</div>
          <div className="flex h-8 items-center">
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground uppercase">Paying users</div>
          <div className="flex h-8 items-center">
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground uppercase">Free users</div>
          <div className="flex h-8 items-center">
            <Skeleton className="h-4 w-16" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="text-xs text-muted-foreground uppercase">Engagement</div>
          <div className="flex h-8 items-center">
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search input skeleton */}
        <div className="relative">
          <Input className="peer ps-9" disabled placeholder="Loading..." type="text" />

          {/* Decorative icon */}
          <div className="pointer-events-none absolute inset-y-0 inset-s-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
            <Funnel size={16} />
          </div>
        </div>

        {/* Table skeleton */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground">
                  <Skeleton className="h-4 w-24" />
                </TableHead>
                <TableHead className="text-muted-foreground">
                  <Skeleton className="h-4 w-16" />
                </TableHead>
                <TableHead className="text-muted-foreground">
                  <Skeleton className="h-4 w-32" />
                </TableHead>
                <TableHead className="text-muted-foreground">
                  <Skeleton className="h-4 w-32" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow className="hover:bg-transparent" key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination skeleton */}
        <div className="flex items-center justify-between gap-3 max-sm:flex-col">
          <Skeleton className="h-4 w-32" />
          <div className="grow">
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
          <Skeleton className="h-9 w-32" />
        </div>
      </div>
    </>
  );
}
