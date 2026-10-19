'use client';

import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import Link from '@remark/adapters/link';
import { useRouter } from '@remark/adapters/navigation';
import { zodResolver } from '@remark/adapters/resolver';
import { Button } from '@remark/components/ui/Button';
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
import { authClient } from '@remark/lib/auth-client';
import { BadgeAlertIcon, InboxIcon } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { CircleArrow } from './CircleArrow';
import { Logo } from './Logo';

const formSchema = z.object({ email: z.email({ error: 'Please enter a valid email.' }) });

type FormValues = z.infer<typeof formSchema>;
type Mode = 'sign-in' | 'sign-up';
type OAuthProvider = 'github' | 'gitlab';
type Step = 'email' | 'inbox';

export function SignInSignUpForm({ mode }: { mode: Mode }) {
  const isSignUp = mode === 'sign-up';
  const router = useRouter();
  const [step, setStep] = React.useState<Step>('email');
  const [isLoading, setIsLoading] = React.useState<null | OAuthProvider>(null);
  const [isHovering, setIsHovering] = React.useState(false);

  const form = useForm<FormValues>({
    defaultValues: { email: '' },
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (isSignUp) return; // Don't preload passkeys for sign up

    if (
      typeof PublicKeyCredential === 'undefined' ||
      typeof PublicKeyCredential.isConditionalMediationAvailable !== 'function'
    ) {
      return;
    }

    const preloadPasskey = async () => {
      if (!(await PublicKeyCredential.isConditionalMediationAvailable())) return;

      await authClient.signIn.passkey({
        autoFill: true,
        fetchOptions: {
          onSuccess: () => {
            router.push('/');
          },
        },
      });
    };

    void preloadPasskey();
  }, [router, isSignUp]);

  async function onSubmit({ email }: FormValues) {
    const { error } = await authClient.signIn.magicLink({ email });

    if (error) {
      void toast({
        description: "Couldn't send you a magic link.",
        Icon: BadgeAlertIcon,
        title: 'Something went wrong',
        variant: 'destructive',
      });
    }

    setStep('inbox');
  }

  async function signInWithOAuthProvider(provider: OAuthProvider) {
    setIsLoading(provider);

    const { error } = await authClient.signIn.social({ provider });

    if (error) {
      setIsLoading(null);
    }
  }

  if (step === 'inbox') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-center gap-2">
          <div className="flex size-11 items-center justify-center rounded-full border">
            <InboxIcon className="opacity-60" size={20} />
          </div>

          <div className="flex flex-col gap-1.5 text-center">
            <h2 className="text-lg font-semibold tracking-tight">Check your inbox</h2>
            <p className="text-sm text-balance text-muted-foreground">
              Click the link we&apos;ve just sent you to{' '}
              <span className="font-medium text-foreground">{form.getValues('email')}</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border select-none">
          <Logo.Remark size={24} variant="logomark" />
        </div>
        <div className="flex flex-col text-center">
          <h2 className="text-lg font-semibold tracking-tight">
            {isSignUp ? 'Create an account' : 'Welcome back'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isSignUp
              ? 'We just need a few details to get you started.'
              : 'Enter your email to sign in to your account.'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form
          className="w-full space-y-5"
          onSubmit={(event) => {
            void form.handleSubmit(onSubmit)(event);
          }}
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="not-first:mt-6">
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" {...field} autoComplete="username webauthn" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hidden password field for passkey */}
          <VisuallyHidden>
            <Input autoComplete="current-password webauthn" type="password" />
          </VisuallyHidden>

          <Button
            className="w-full"
            loading={form.formState.isSubmitting}
            onMouseEnter={() => {
              setIsHovering(true);
            }}
            onMouseLeave={() => {
              setIsHovering(false);
            }}
            type="submit"
          >
            Sign {isSignUp ? 'Up' : 'In'}
            <CircleArrow direction="right" isHovering={isHovering} />
          </Button>
        </form>
      </Form>

      <div className="flex items-center gap-3 before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
        <span className="text-xs text-muted-foreground uppercase">Or</span>
      </div>

      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <Button
          className="w-full"
          loading={isLoading === 'github'}
          onClick={() => {
            void signInWithOAuthProvider('github');
          }}
          variant="outline"
        >
          <Logo.GitHub />
          Sign {isSignUp ? 'Up' : 'In'} with GitHub
        </Button>

        <Button
          className="w-full"
          loading={isLoading === 'gitlab'}
          onClick={() => {
            void signInWithOAuthProvider('gitlab');
          }}
          variant="outline"
        >
          <Logo.GitLab />
          Sign {isSignUp ? 'Up' : 'In'} with GitLab
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        By signing up you agree to our{' '}
        <Button asChild className="text-xs" variant="link">
          <Link href="/terms">terms</Link>
        </Button>
        .
      </p>
    </>
  );
}
