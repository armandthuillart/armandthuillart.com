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
import { createApiKey } from '@remark/lib/db/actions';
import { BadgeAlertIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({ name: z.string().min(1).max(50) });

type FormValues = z.infer<typeof formSchema>;

export function CreateApiKeyDialog() {
  const { open, setApiKey, setOpen } = useApiKeyStore();

  const form = useForm<FormValues>({
    defaultValues: { name: '' },
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: FormValues) {
    const res = await createApiKey({
      name: values.name,
      pathname: '/api-keys',
    });

    if (res.data.failure) {
      void toast({
        description: 'Please try again.',
        Icon: BadgeAlertIcon,
        title: 'Something went wrong',
        variant: 'destructive',
      });
    }

    setOpen('view');
    setApiKey(res.data.apiKey?.key ?? null);
    form.reset();
  }

  return (
    <Dialog
      onOpenChange={() => {
        setOpen(null);
      }}
      open={open === 'create'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create API key</DialogTitle>
          <VisuallyHidden>
            <DialogDescription>
              Create a new API key so we know it&apos;s you when you make requests.
            </DialogDescription>
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
                Create
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
