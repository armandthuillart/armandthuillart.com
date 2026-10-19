'use client';

import { Badge } from '@remark/components/ui/Badge';
import { Button } from '@remark/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@remark/components/ui/DropdownMenu';
import { useApiKeyStore } from '@remark/lib/api-key-store';
import type { ApiKey } from '@remark/lib/api-key-types';
import type { AppColumnDef } from '@remark/lib/table';
import { capitalizeFirstLetter, cn } from '@remark/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Edit3Icon, LockKeyholeIcon, MoreHorizontalIcon, Trash2Icon } from 'lucide-react';

export const apiKeysColumns: AppColumnDef<ApiKey>[] = [
  {
    accessorKey: 'name',
    cell: ({ row }) => {
      const isActive = row.original.lastRequest;

      return (
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg border border-border p-0.5">
            <div
              className={cn(
                'flex size-full items-center justify-center rounded-md border',
                isActive
                  ? 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:ring-green-500/20'
                  : 'border-border bg-foreground/5 text-muted-foreground',
              )}
            >
              <LockKeyholeIcon className="opacity-80" size={16} />
            </div>
          </div>
          {row.original.name}
        </div>
      );
    },
    header: 'Name',
  },
  {
    accessorKey: 'start',
    cell: ({ row }) => <Badge variant="secondary">{row.original.start ?? ''}</Badge>,
    header: 'Starts with',
  },
  {
    accessorKey: 'lastRequest',
    cell: ({ row }) =>
      row.original.lastRequest
        ? capitalizeFirstLetter(formatDistanceToNow(row.original.lastRequest, { addSuffix: true }))
        : 'Not used yet',
    header: 'Last request',
  },
  {
    accessorKey: 'createdAt',
    cell: ({ row }) => {
      const distance = formatDistanceToNow(row.original.createdAt, { addSuffix: true });
      return capitalizeFirstLetter(distance === 'less than a minute ago' ? 'Now' : distance);
    },
    header: 'Created at',
  },
  {
    accessorKey: 'actions',
    cell: ({ row }) => <ActionsCell apiKeyId={row.original.id} />,
    header: 'Actions',
  },
];

const ActionsCell = ({ apiKeyId }: { apiKeyId: string }) => {
  const { setOpen, setSelectedApiKeyId } = useApiKeyStore();

  return (
    <div className="text-center">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="size-7" size="icon" variant="ghost">
            <MoreHorizontalIcon size={16} />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="min-w-42">
          <DropdownMenuItem
            onClick={() => {
              setSelectedApiKeyId(apiKeyId);
              setOpen('update');
            }}
          >
            <Edit3Icon size={16} />
            Edit API key
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              setSelectedApiKeyId(apiKeyId);
              setOpen('delete');
            }}
            variant="destructive"
          >
            <Trash2Icon size={16} />
            Delete API key
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
