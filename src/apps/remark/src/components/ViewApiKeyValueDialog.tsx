'use client';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Alert, AlertDescription } from '@remark/components/ui/Alert';
import { Button } from '@remark/components/ui/Button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@remark/components/ui/Dialog';
import { Input } from '@remark/components/ui/Input';
import { toast } from '@remark/components/ui/Sonner';
import { useApiKeyStore } from '@remark/lib/api-key-store';
import {
  CheckIcon,
  ClipboardCheckIcon,
  CopyIcon,
  EyeIcon,
  EyeOffIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import React from 'react';

export function ViewApiKeyValueDialog() {
  const { apiKey, open, setApiKey, setOpen } = useApiKeyStore();

  const [isCopied, setIsCopied] = React.useState(false);
  const [isVisible, setIsVisible] = React.useState(false);

  async function handleCopy() {
    setIsCopied(true);
    await navigator.clipboard.writeText(apiKey ?? '');

    void toast({
      description: 'Paste it into your .env file',
      Icon: ClipboardCheckIcon,
      title: 'Copied to clipboard',
    });

    setTimeout(() => {
      setIsCopied(false);
    }, 2000);
  }

  return (
    <Dialog
      onOpenChange={() => {
        setOpen(null);
        setApiKey(null);
      }}
      open={open === 'view'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>View API Key </DialogTitle>
        </DialogHeader>

        <VisuallyHidden>
          <DialogDescription>View the API key so you can paste it in your .env.</DialogDescription>
        </VisuallyHidden>

        <Alert variant="error">
          <TriangleAlertIcon size={16} />
          <AlertDescription>You can only view it once.</AlertDescription>
        </Alert>

        <div className="relative">
          <Input
            className="pr-20 font-mono"
            readOnly
            type={isVisible ? 'text' : 'password'}
            value={apiKey ?? ''}
          />

          <div className="absolute top-1/2 right-1.5 flex -translate-y-1/2 gap-1">
            <Button
              className="size-7 rounded"
              onClick={() => {
                setIsVisible(!isVisible);
              }}
              size="icon"
              variant="ghost"
            >
              {isVisible ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
            </Button>

            <Button
              className="size-7 rounded"
              onClick={() => {
                void handleCopy();
              }}
              size="icon"
              variant="ghost"
            >
              {isCopied ? (
                <CheckIcon className="fade-in animate-in" size={16} />
              ) : (
                <CopyIcon className="fade-out animate-out" size={16} />
              )}
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              setOpen(null);
            }}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
