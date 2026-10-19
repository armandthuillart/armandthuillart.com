'use client';

import Link from '@remark/adapters/link';
import { useRouter } from '@remark/adapters/navigation';
import { useTheme } from '@remark/adapters/theme';
import { Avatar, AvatarFallback } from '@remark/components/ui/Avatar';
import { Button } from '@remark/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@remark/components/ui/DropdownMenu';
import { Skeleton } from '@remark/components/ui/Skeleton';
import { authClient } from '@remark/lib/auth-client';
import { Ellipsis, Home, LogOut, Moon, Sun, UserRoundPen } from 'lucide-react';

import { TextShimmer } from './TextShimmer';

export function DesktopDropdownMenu() {
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const { data: session, isPending } = authClient.useSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="w-full justify-between" size="sm" variant="ghost">
          <div className="flex items-center gap-3 overflow-hidden">
            <Avatar className="size-6 overflow-visible border">
              <AvatarFallback className="bg-background">
                {isPending ? (
                  <Skeleton className="size-full rounded-full" />
                ) : (
                  <span className="text-xs uppercase">{session?.user.email.charAt(0)}</span>
                )}
              </AvatarFallback>
            </Avatar>

            <span className="truncate">
              {isPending ? <TextShimmer>Loading...</TextShimmer> : session?.user.email}
            </span>
          </div>

          <div className="flex size-6 items-center justify-center">
            <Ellipsis className="opacity-60" />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 min-w-0">
        <DropdownMenuItem asChild>
          <Link href="/profile">
            <UserRoundPen className="opacity-60" />
            My profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="justify-between"
          onClick={() => {
            setTheme(theme === 'dark' ? 'light' : 'dark');
          }}
        >
          <div className="flex items-center gap-2">
            {theme === 'dark' ? <Sun className="opacity-60" /> : <Moon className="opacity-60" />}
            Toggle theme
          </div>
          <DropdownMenuShortcut>M</DropdownMenuShortcut>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <Link href="/home">
            <Home className="opacity-60" />
            Home page
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            void authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push('/sign-in');
                },
              },
            });
          }}
        >
          <LogOut className="opacity-60" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
