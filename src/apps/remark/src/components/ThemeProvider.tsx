'use client';

import { ThemeProvider as NextThemeProvider, useTheme } from '@remark/adapters/theme';
import React from 'react';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemeProvider>
      <ThemeToggle />
      {children}
    </NextThemeProvider>
  );
}

function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  React.useEffect(() => {
    const isTypingField = (element: HTMLElement) => {
      return (
        element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.isContentEditable
      );
    };

    const isThemeToggleKey = (event: KeyboardEvent) => {
      return event.key.toLowerCase() === 'm' && !event.metaKey && !event.ctrlKey && !event.altKey;
    };

    const handleKeyPress = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;

      if (!isTypingField(target) && isThemeToggleKey(event)) {
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [setTheme, theme]);

  return null;
}
