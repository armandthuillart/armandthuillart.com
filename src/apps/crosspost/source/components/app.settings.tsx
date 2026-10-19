'use client';

import { VisuallyHidden } from 'radix-ui';
import { type ReactNode, useState, useTransition } from 'react';

import type { User } from '../lib/types';
import { cn } from '../lib/utils';
import {
  type Locale,
  useLocale,
  useTranslations,
  useTheme,
  parseAsBoolean,
  useQueryState,
  themeColors,
  usePathname,
  useRouter,
  routing,
  checkout,
  customer,
  useThemeStore,
} from '../local/runtime';
import { Button } from './ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from './ui/drawer';
import {
  AppearanceIcon,
  LanguageIcon,
  MailIcon,
  PaintBrushIcon,
  SquareLinkIcon,
  StarIcon,
} from './ui/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';

const snapPoints = [0.5, 1];

interface AppSettingsProps {
  children: ReactNode;
  isFree: boolean;
  user: User | null;
}

export function AppSettings({ children, isFree, user }: AppSettingsProps) {
  const t = useTranslations('AppSettings');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const [snap, setSnap] = useState<null | number | string>(snapPoints[0]);
  const { setTheme, theme, themes } = useTheme();
  const [isPending, startTransition] = useTransition();
  const { setThemeColor, themeColor } = useThemeStore();

  function handleLocaleChange(locale: Locale) {
    startTransition(() => {
      router.replace(pathname, { locale });
    });
  }

  async function handleSubscription() {
    if (isFree) {
      await checkout({ slug: 'pro' });
    } else {
      await customer.portal();
    }
  }

  const [isOpen, setIsOpen] = useQueryState('settings', parseAsBoolean.withDefault(false));

  return (
    <Drawer
      activeSnapPoint={snap}
      fadeFromIndex={0}
      onOpenChange={setIsOpen}
      open={isOpen}
      setActiveSnapPoint={setSnap}
      snapPoints={snapPoints}
      snapToSequentialPoint
    >
      {children}
      <DrawerContent className="fixed inset-0 top-auto -mx-px flex h-full flex-col bg-background data-[vaul-drawer-direction=bottom]:max-h-9/10 data-[vaul-drawer-direction=bottom]:rounded-t-3xl">
        <div
          className={cn('mx-auto flex w-full max-w-lg flex-col p-4 pt-5', {
            'overflow-hidden': snap !== 1,
            'overflow-y-auto': snap === 1,
          })}
        >
          <DrawerHeader>
            <DrawerTitle className="text-xl">{t('title')}</DrawerTitle>
            <VisuallyHidden.Root>
              <DrawerDescription>{t('title')}</DrawerDescription>
            </VisuallyHidden.Root>
          </DrawerHeader>

          <div className="flex flex-col gap-8">
            <SettingsCategory title={t('account')}>
              <SettingsGroup>
                <SettingsGroupItem icon={<MailIcon className="size-5" />} title={t('email')}>
                  <span className="text-muted-foreground">{user?.email}</span>
                </SettingsGroupItem>

                <Separator />

                <SettingsGroupItem icon={<StarIcon className="size-5" />} title={t('subscription')}>
                  <Button
                    className="min-w-28 justify-between bg-background px-3 font-normal text-foreground hover:bg-background"
                    onClick={handleSubscription}
                  >
                    {user?.tier === 'pro' ? t('manage') : t('upgrade')}
                    <SquareLinkIcon className="size-4 text-muted-foreground" />
                  </Button>
                </SettingsGroupItem>
              </SettingsGroup>
            </SettingsCategory>

            <SettingsCategory title={t('app')}>
              <SettingsGroup>
                <SettingsGroupItem
                  icon={<LanguageIcon className="size-5" />}
                  title={t('appLanguage')}
                >
                  <Select defaultValue={locale} onValueChange={handleLocaleChange} value={locale}>
                    <SelectTrigger className="w-fit bg-background" disabled={isPending}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {routing.locales.map((locale) => (
                        <SelectItem key={locale} value={locale}>
                          {locale === 'en' && 'English'}
                          {locale === 'fr' && 'Français'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingsGroupItem>

                <Separator />

                <SettingsGroupItem
                  icon={<AppearanceIcon className="size-5" />}
                  title={t('appearance')}
                >
                  <Select onValueChange={setTheme} value={theme}>
                    <SelectTrigger className="w-fit bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {themes.map((theme) => (
                        <SelectItem key={theme} value={theme}>
                          {theme === 'system' && t('system')}
                          {theme === 'light' && t('light')}
                          {theme === 'dark' && t('dark')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingsGroupItem>

                <Separator />

                <SettingsGroupItem
                  icon={<PaintBrushIcon className="size-5" />}
                  title={t('themeColor')}
                >
                  <Select onValueChange={setThemeColor} value={themeColor}>
                    <SelectTrigger className="w-fit bg-background">
                      <SelectValue />
                    </SelectTrigger>

                    <SelectContent alignOffset={-5}>
                      {themeColors.map((themeColor) => (
                        <SelectItem key={themeColor} value={themeColor}>
                          <span className="flex items-center gap-2">
                            <span
                              className={cn(
                                'size-2.5 rounded-full',
                                themeColor === 'default' ? 'bg-muted dark:bg-accent' : 'bg-primary',
                              )}
                              data-theme={themeColor}
                            />
                            {t(themeColor)}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </SettingsGroupItem>
              </SettingsGroup>
            </SettingsCategory>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function SettingsCategory({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="pl-4 text-sm text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function SettingsGroup({ children }: { children: ReactNode }) {
  return <ul className="rounded-xl bg-muted pr-2.5 pl-4">{children}</ul>;
}

function SettingsGroupItem({
  children,
  icon,
  title,
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <li className="flex h-14 items-center justify-between">
      <div className="flex items-center gap-2.5">
        {icon}
        {title}
      </div>
      {children}
    </li>
  );
}
