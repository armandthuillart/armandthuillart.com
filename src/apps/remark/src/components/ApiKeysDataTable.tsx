'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@remark/components/ui/Table';
import { useApiKeyStore } from '@remark/lib/api-key-store';
import type { ApiKey } from '@remark/lib/api-key-types';
import { type AppColumnDef, features } from '@remark/lib/table';
import { flexRender, useTable } from '@tanstack/react-table';
import { KeyRound } from 'lucide-react';

import { EmptyState } from './EmptyState';

export function ApiKeysDataTable({
  columns,
  data,
}: {
  columns: AppColumnDef<ApiKey>[];
  data: ApiKey[];
}) {
  const { setOpen } = useApiKeyStore();

  const table = useTable({
    columns,
    data,
    features,
  });

  if (table.getRowModel().rows.length === 0) {
    return (
      <div className="container">
        <EmptyState
          action={{
            label: 'Create API Key',
            onClick: () => {
              setOpen('create');
            },
          }}
          description="API Keys are randomly generated alpha-numeric strings that are used to send feedbacks."
          icons={[KeyRound, KeyRound, KeyRound]}
          title="You don't have any API keys yet"
        />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="relative w-full overflow-x-auto overflow-y-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow className="hover:bg-transparent" key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      className="md:not-last:w-2/10 md:last:w-1/10 md:last:text-center"
                      key={header.id}
                    >
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
            {table.getRowModel().rows.map((row) => (
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
