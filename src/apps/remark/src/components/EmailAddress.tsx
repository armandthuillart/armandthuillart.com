'use client';

import { zodResolver } from '@remark/adapters/resolver';
import { Button } from '@remark/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@remark/components/ui/Card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@remark/components/ui/Form';
import { Input } from '@remark/components/ui/Input';
import { toast } from '@remark/components/ui/Sonner';
import { authClient } from '@remark/lib/auth-client';
import { BadgeAlertIcon, InboxIcon } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { TextShimmer } from './TextShimmer';

const formSchema = z.object({ email: z.email() });

type FormValues = z.infer<typeof formSchema>;

export function EmailAddress() {
  const { data: session, isPending: isLoading } = authClient.useSession();

  const form = useForm<FormValues>({
    defaultValues: { email: session?.user.email },
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(data: FormValues) {
    const { error } = await authClient.changeEmail({ newEmail: data.email });

    if (error) {
      return toast({
        description: error.message,
        Icon: BadgeAlertIcon,
        title: 'Something went wrong',
        variant: 'destructive',
      });
    }

    void toast({
      description: "We've sent you a link to confirm your new email.",
      Icon: InboxIcon,
      title: 'Check your inbox',
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => {
          void form.handleSubmit(onSubmit)(event);
        }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Email</CardTitle>
            <CardDescription>
              Please enter the email address you want to use to log in.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="flex justify-between gap-6">
              <div className="flex w-full flex-col gap-3">
                <div className="max-w-80">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="relative">
                            <Input {...field} />

                            {isLoading && (
                              <div className="absolute inset-0 flex items-center px-3">
                                <TextShimmer className="text-sm">Loading...</TextShimmer>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              disabled={!form.formState.isDirty}
              loading={form.formState.isSubmitting}
              type="submit"
            >
              Update
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
