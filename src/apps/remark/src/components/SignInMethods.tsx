'use client';

import type { Account, Passkey } from '@remark/adapters/types';
import { Button } from '@remark/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@remark/components/ui/Card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@remark/components/ui/Dialog';
import { toast } from '@remark/components/ui/Sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@remark/components/ui/Table';
import { authClient } from '@remark/lib/auth-client';
import { cn } from '@remark/lib/utils';
import { format } from 'date-fns';
import { AlertTriangle, CheckCircle2, KeyRound, KeyRoundIcon, Trash2 } from 'lucide-react';
import React from 'react';

import { Logo } from './Logo';

type Loading = 'delete' | 'github' | 'gitlab' | 'initial' | 'passkey' | null;
type Provider = 'github' | 'gitlab' | 'passkey';

export function SignInMethods() {
  const [loading, setLoading] = React.useState<Loading>('initial');
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [passkeys, setPasskeys] = React.useState<Passkey[]>([]);

  React.useEffect(() => {
    async function loadData() {
      const [accountsResponse, passkeysResponse] = await Promise.all([
        authClient.listAccounts(),
        authClient.passkey.listUserPasskeys(),
      ]);

      setAccounts(
        (accountsResponse.data ?? []).map((account) => ({
          ...account,
          providerId: account.provider,
          userId: account.accountId,
        })),
      );
      setPasskeys(passkeysResponse.data ?? []);
      setLoading(null);
    }

    void loadData();
  }, []);

  const hasGithub = accounts.some((account) => account.providerId === 'github');
  const hasGitlab = accounts.some((account) => account.providerId === 'gitlab');
  const hasPasskey = passkeys.length > 0;
  const showProviders = !(hasGithub && hasGitlab && hasPasskey);

  async function link(provider: Provider) {
    if (loading !== null) {
      return;
    }

    setLoading(provider);

    if (provider === 'passkey') {
      try {
        const { error } = await authClient.passkey.addPasskey();
        if (error) {
          throw new Error(error.message);
        }
        const { data } = await authClient.passkey.listUserPasskeys();
        setPasskeys(data ?? []);
      } catch (error) {
        void toast({
          description: error instanceof Error ? error.message : 'Please try again later.',
          Icon: AlertTriangle,
          title: 'Something went wrong',
        });
      }
    } else {
      const { error } = await authClient.linkSocial({
        callbackURL: '/profile',
        provider,
      });

      if (error) {
        void toast({
          description: error.message,
          Icon: AlertTriangle,
          title: 'Something went wrong',
        });
      } else {
        const { data } = await authClient.listAccounts();
        setAccounts(
          (data ?? []).map((account) => ({
            ...account,
            providerId: account.provider,
            userId: account.accountId,
          })),
        );
      }
    }

    setLoading(null);
  }

  async function unlink(provider: Provider, passkeyId?: string) {
    if (loading !== null) {
      return;
    }

    setLoading('delete');

    if (provider === 'passkey') {
      if (!passkeyId) {
        void toast({
          description: 'Passkey not found.',
          Icon: AlertTriangle,
          title: 'Something went wrong',
        });
        setLoading(null);
        return;
      }

      try {
        const { error: deleteError } = await authClient.passkey.deletePasskey({ id: passkeyId });

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        // Force a reload of the passkeys
        const { data: updatedPasskeys, error: listError } =
          await authClient.passkey.listUserPasskeys();

        if (listError) {
          throw new Error(listError.message);
        }

        // Check if the passkey was actually deleted
        const passkeyStillExists = updatedPasskeys?.some((p) => p.credentialID === passkeyId);
        if (passkeyStillExists) {
          throw new Error('Passkey deletion failed - passkey still exists');
        }

        setPasskeys(updatedPasskeys ?? []);
        void toast({
          description: 'Passkey has been removed.',
          Icon: CheckCircle2,
          title: 'Success',
        });
      } catch (error) {
        void toast({
          description:
            error instanceof Error ? error.message : 'Failed to delete passkey. Please try again.',
          Icon: AlertTriangle,
          title: 'Something went wrong',
        });
      } finally {
        setLoading(null);
      }
    } else {
      const { error } = await authClient.unlinkAccount({ providerId: provider });

      if (error) {
        void toast({
          description: error.message,
          Icon: AlertTriangle,
          title: 'Something went wrong',
        });
      } else {
        const { data } = await authClient.listAccounts();
        setAccounts(
          (data ?? []).map((account) => ({
            ...account,
            providerId: account.provider,
            userId: account.accountId,
          })),
        );
      }
    }

    setLoading(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Authentication</CardTitle>

        <CardDescription>Manage the sign-in methods for your account.</CardDescription>
      </CardHeader>

      <CardContent>
        {showProviders && (
          <>
            <div className="mb-4 border-b border-border pb-4 text-sm font-semibold">Add new</div>

            <div className="flex items-center gap-3">
              {!hasGithub && (
                <Button
                  disabled={loading !== null}
                  loading={loading === 'initial' || loading === 'github'}
                  onClick={() => {
                    void link('github');
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Logo.GitHub />
                  Link GitHub
                </Button>
              )}

              {!hasGitlab && (
                <Button
                  disabled={loading !== null}
                  loading={loading === 'initial' || loading === 'gitlab'}
                  onClick={() => {
                    void link('gitlab');
                  }}
                  size="sm"
                  variant="outline"
                >
                  <Logo.GitLab />
                  Link GitLab
                </Button>
              )}

              {!hasPasskey && (
                <Button
                  disabled={loading !== null}
                  loading={loading === 'initial' || loading === 'passkey'}
                  onClick={() => {
                    void link('passkey');
                  }}
                  size="sm"
                  variant="outline"
                >
                  <KeyRound className="opacity-60" />
                  Add Passkey
                </Button>
              )}
            </div>
          </>
        )}

        {(accounts.length > 0 || passkeys.length > 0) && (
          <Table className={cn({ 'mt-6': showProviders })}>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Provider</TableHead>
                <TableHead className="w-1/4">Date</TableHead>
                <TableHead className="w-1/12 text-center">Action</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {accounts.map((account) => {
                const providerId = account.providerId;
                const isGithub = providerId === 'github';
                const providerName = isGithub ? 'GitHub' : 'GitLab';

                const ProviderLogo = isGithub ? Logo.GitHub : Logo.GitLab;

                const date = format(account.createdAt, 'MMMM d, yyyy');

                return (
                  <TableRow className="hover:bg-transparent" key={account.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ProviderLogo />
                        <div className="text-sm font-medium">{providerName}</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-muted-foreground">Connected on {date}</div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button loading={loading === 'delete'} size="icon" variant="ghost">
                            <Trash2 className="opacity-60" />
                          </Button>
                        </DialogTrigger>

                        <DialogContent>
                          <DialogTitle>Unlink {providerName}</DialogTitle>
                          <DialogDescription>
                            You are about to unlink your {providerName} account. After removing it,
                            you won&apos;t be able to use it to log in.
                          </DialogDescription>

                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>

                            <Button
                              className="w-23"
                              loading={loading === 'delete'}
                              onClick={() => {
                                void unlink(providerId as Provider);
                              }}
                            >
                              Continue
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}

              {passkeys.map((passkey) => {
                const date = format(passkey.createdAt, 'MMMM d, yyyy');

                return (
                  <TableRow className="hover:bg-transparent" key={passkey.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <KeyRoundIcon size={20} />
                        <div className="text-sm font-medium">Passkey</div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-sm text-muted-foreground">Added on {date}</div>
                    </TableCell>

                    <TableCell className="text-center">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button loading={loading === 'delete'} size="icon" variant="ghost">
                            <Trash2 size={16} />
                          </Button>
                        </DialogTrigger>

                        <DialogContent>
                          <DialogTitle>Remove Passkey</DialogTitle>
                          <DialogDescription>
                            You are about to remove your passkey. After removing it, you won&apos;t
                            be able to use it to log in.
                          </DialogDescription>

                          <DialogFooter>
                            <DialogClose asChild>
                              <Button variant="outline">Cancel</Button>
                            </DialogClose>

                            <Button
                              className="w-23"
                              loading={loading === 'delete'}
                              onClick={() => {
                                void unlink('passkey', passkey.id);
                              }}
                            >
                              Continue
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
