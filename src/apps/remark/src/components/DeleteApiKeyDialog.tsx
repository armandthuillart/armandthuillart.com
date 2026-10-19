'use client';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { zodResolver } from '@remark/adapters/resolver';
import { Alert, AlertDescription } from '@remark/components/ui/Alert';
import { Button } from '@remark/components/ui/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@remark/components/ui/Dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@remark/components/ui/Form';
import { Input } from '@remark/components/ui/Input';
import { toast } from '@remark/components/ui/Sonner';
import { useApiKeyStore } from '@remark/lib/api-key-store';
import { deleteApiKey } from '@remark/lib/db/actions';
import { BadgeAlertIcon, TriangleAlertIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({ confirmation: z.string().min(1, 'Confirmation is required') });

type FormValues = z.infer<typeof formSchema>;

export function DeleteApiKeyDialog() {
  const { open, selectedApiKeyId, setOpen } = useApiKeyStore();

  const form = useForm<FormValues>({
    defaultValues: { confirmation: '' },
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: FormValues) {
    if (!selectedApiKeyId || values.confirmation !== 'DELETE') {
      form.setError('confirmation', {
        message: 'Please type DELETE to confirm',
        type: 'manual',
      });
      return;
    }

    const res = await deleteApiKey({ keyId: selectedApiKeyId });

    if (res.data.failure) {
      void toast({
        description: 'Please try again.',
        Icon: BadgeAlertIcon,
        title: 'Something went wrong',
        variant: 'destructive',
      });
    }

    setOpen(null);
    form.reset();
  }

  return (
    <Dialog
      onOpenChange={() => {
        setOpen(null);
      }}
      open={open === 'delete'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete API key</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
              You are about to delete this API key. This action cannot be undone.
            </DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <Alert variant="error">
          <TriangleAlertIcon size={16} />
          <AlertDescription>This action cannot be undone.</AlertDescription>
        </Alert>

        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              void form.handleSubmit(onSubmit)(event);
            }}
          >
            <FormField
              control={form.control}
              name="confirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    <div>
                      Type <span className="font-mono font-bold">DELETE</span> to confirm
                    </div>
                  </FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </DialogClose>

              <Button
                disabled={!form.formState.isDirty}
                loading={form.formState.isSubmitting}
                type="submit"
                variant="destructive"
              >
                Delete
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
