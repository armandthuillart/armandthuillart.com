import { cn } from '@remark/lib/utils';
import { type LucideIcon, XIcon } from 'lucide-react';
import { type ToasterProps, toast as sonnerToast } from 'sonner';

import { Button } from './Button';

interface ToastProps {
  button?: { label: string; onClick: () => void };
  description?: string;
  Icon: LucideIcon;
  id: number | string;
  position?: ToasterProps['position'];
  title: string;
  variant?: 'default' | 'destructive';
}

function toast(toast: Omit<ToastProps, 'id'>) {
  return sonnerToast.custom(
    (id) => (
      <Toast
        button={toast.button}
        description={toast.description}
        Icon={toast.Icon}
        id={id}
        position={toast.position}
        title={toast.title}
        variant={toast.variant}
      />
    ),
    { position: toast.position },
  );
}

function Toast({ description, Icon, id, title, variant = 'default' }: ToastProps) {
  return (
    <div className="flex w-(--width) items-center justify-between gap-4 rounded-lg border border-border bg-background p-4 shadow-lg shadow-black/5">
      <div
        className={cn(
          'border-border flex size-9 shrink-0 items-center justify-center rounded-full border',
          variant === 'destructive' && 'text-destructive',
        )}
      >
        <Icon className="opacity-60" size={20} />
      </div>

      <div className="flex w-full flex-col gap-1">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>

      <Button
        className="shrink-0"
        onClick={() => sonnerToast.dismiss(id)}
        size="icon"
        variant="ghost"
      >
        <XIcon size={20} />
      </Button>
    </div>
  );
}

export { toast };
