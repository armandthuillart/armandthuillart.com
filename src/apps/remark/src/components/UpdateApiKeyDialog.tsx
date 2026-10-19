'use client';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { zodResolver } from '@remark/adapters/resolver';
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
import type { ApiKey } from '@remark/lib/api-key-types';
import { updateApiKey } from '@remark/lib/db/actions';
import { BadgeAlertIcon } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({ name: z.string().min(1).max(50) });

type FormValues = z.infer<typeof formSchema>;

export function UpdateApiKeyDialog({ apiKeys }: { apiKeys: ApiKey[] }) {
  const { open, selectedApiKeyId, setOpen } = useApiKeyStore();

  const form = useForm<FormValues>({
    defaultValues: { name: apiKeys.find((key) => key.id === selectedApiKeyId)?.name ?? '' },
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (open === 'update')
      form.reset({ name: apiKeys.find((key) => key.id === selectedApiKeyId)?.name ?? '' });
  }, [open, selectedApiKeyId, apiKeys, form]);

  async function onSubmit(values: FormValues) {
    if (!selectedApiKeyId) return;

    const res = await updateApiKey({
      keyId: selectedApiKeyId,
      newName: values.name,
    });

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
      open={open === 'update'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update API key</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>Update the name of your API key.</DialogDescription>
          </VisuallyHidden>
        </DialogHeader>

        <Form {...form}>
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              void form.handleSubmit(onSubmit)(event);
            }}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
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
              >
                Update
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
