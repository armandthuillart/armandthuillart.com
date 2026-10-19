'use client';

import Link from '@remark/adapters/link';
import { usePathname } from '@remark/adapters/navigation';
import { zodResolver } from '@remark/adapters/resolver';
import { Button, buttonVariants } from '@remark/components/ui/Button';
import { Form, FormControl, FormField, FormItem } from '@remark/components/ui/Form';
import { Popover, PopoverContent, PopoverTrigger } from '@remark/components/ui/Popover';
import { toast } from '@remark/components/ui/Sonner';
import { Textarea } from '@remark/components/ui/Textarea';
import { createFeedback } from '@remark/lib/db/actions';
import { cn } from '@remark/lib/utils';
import { BadgeAlertIcon, HeartIcon, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const formSchema = z.object({ text: z.string().min(2).max(2000) });

type FormValues = z.infer<typeof formSchema>;

export function FeedbackPopover() {
  const [isOpen, setIsOpen] = React.useState(false);
  const pathname = usePathname();

  const form = useForm<FormValues>({
    defaultValues: { text: '' },
    resolver: zodResolver(formSchema),
  });

  async function onSubmit(values: FormValues) {
    const result = await createFeedback({
      metadata: { path: pathname },
      text: values.text,
    });

    if (result.data.failure) {
      void toast({
        description: 'Please try again.',
        Icon: BadgeAlertIcon,
        title: 'Something went wrong',
        variant: 'destructive',
      });
    }

    setTimeout(() => {
      setIsOpen(false);
      setTimeout(() => {
        form.reset();
      }, 200); // Time it takes to close
    }, 3000);
  }

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline">
          Feedback
          <Sparkles className="opacity-60" size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-xs p-3 md:w-sm">
        <AnimatePresence mode="wait">
          {form.formState.isSubmitted ? (
            <motion.div
              animate={{ opacity: 1 }}
              className="flex h-39 flex-col items-center justify-center gap-1.5 text-center"
              exit={{ opacity: 0 }}
              initial={{ opacity: 0 }}
              key="submitted"
            >
              <div className="border-destructive/10 bg-destructive/2.5 rounded-full border p-1">
                <div className="border-destructive/10 bg-destructive/5 rounded-full border p-1">
                  <div className="border-destructive/15 bg-destructive/5 rounded-full border p-3">
                    <HeartIcon className="text-destructive" size={24} />
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Thank you so much for it.</p>
                <p className="text-sm opacity-80">
                  We&apos;ll get back to you as soon as possible.
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div exit={{ opacity: 0 }} key="form">
              <Form {...form}>
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    void form.handleSubmit(onSubmit)(event);
                  }}
                >
                  <FormField
                    control={form.control}
                    name="text"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            className="min-h-28 p-3"
                            placeholder="Ideas to improve this page..."
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Need help?{' '}
                      <Link
                        className={cn(
                          buttonVariants({
                            className: 'text-sm font-normal',
                            variant: 'link',
                          }),
                        )}
                        href="/docs"
                      >
                        Read the docs
                      </Link>
                      .
                    </p>
                    <Button
                      disabled={!form.formState.isDirty}
                      loading={form.formState.isSubmitting}
                      size="sm"
                      type="submit"
                    >
                      Send
                    </Button>
                  </div>
                </form>
              </Form>
            </motion.div>
          )}
        </AnimatePresence>
      </PopoverContent>
    </Popover>
  );
}
