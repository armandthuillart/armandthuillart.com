'use client';

import { zodResolver } from '@remark/adapters/resolver';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@remark/components/ui/AlertDialog';
import { Button } from '@remark/components/ui/Button';
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@remark/components/ui/Card';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@remark/components/ui/Form';
import { Input } from '@remark/components/ui/Input';
import { toast } from '@remark/components/ui/Sonner';
import { authClient } from '@remark/lib/auth-client';
import { BadgeAlertIcon, InboxIcon } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const confirmMessage = "Please type 'DELETE' to confirm.";
const formSchema = z.object({ prompt: z.string().min(1, { message: confirmMessage }) });

type FormValues = z.infer<typeof formSchema>;

export function DeleteAccount() {
  const [isOpen, setIsOpen] = React.useState(false);

  const form = useForm<FormValues>({
    defaultValues: { prompt: '' },
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(data: FormValues) {
    if (data.prompt !== 'DELETE') {
      form.setError('prompt', { message: "Please type 'DELETE' to confirm." });
      return;
    }

    await authClient.deleteUser({
      callbackURL: '/',
      fetchOptions: {
        onError: () => {
          void toast({
            description: 'Please try again.',
            Icon: BadgeAlertIcon,
            title: 'Something went wrong',
            variant: 'destructive',
          });
        },
        onSuccess: () => {
          void toast({
            description: "We've sent you an email to confirm.",
            Icon: InboxIcon,
            title: 'Check your inbox',
          });
        },
      },
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delete account</CardTitle>
        <CardDescription>Permanently remove your account and all of its contents.</CardDescription>
      </CardHeader>

      <CardFooter>
        <AlertDialog onOpenChange={setIsOpen} open={isOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete</Button>
          </AlertDialogTrigger>

          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account</AlertDialogTitle>
              <AlertDialogDescription>
                Any ongoing subscriptions will be terminated, and it will permanently delete your
                account and data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>

            <Form {...form}>
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  void form.handleSubmit(onSubmit)(event);
                }}
              >
                <FormField
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        <span>
                          To verify, type <span className="font-mono uppercase">delete</span> below:
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} className="font-mono" />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <AlertDialogFooter>
                  <AlertDialogCancel
                    onClick={() => {
                      setIsOpen(false);
                    }}
                  >
                    Cancel
                  </AlertDialogCancel>

                  <Button
                    disabled={!form.formState.isDirty}
                    loading={form.formState.isSubmitting}
                    type="submit"
                    variant="destructive"
                  >
                    Delete
                  </Button>
                </AlertDialogFooter>
              </form>
            </Form>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
