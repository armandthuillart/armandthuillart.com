'use client';

import { useEffect } from 'react';

type ShortcutConfig = {
  id: string;
  key: string;
  label: string;
  shift?: boolean;
  modifier?: boolean;
};

type ShortcutName = 'TOGGLE_SIDEBAR' | 'SEE_SHORTCUTS';

export function useShortcut(shortcut: ShortcutConfig, callback: () => void) {
  useEffect(() => {
    const isMac = /Mac|iPod|iPhone|iPad|Apple/.test(navigator.userAgent);

    function isModifierHeld(event: KeyboardEvent) {
      return shortcut.modifier
        ? isMac
          ? event.metaKey
          : event.ctrlKey
        : !(isMac ? event.metaKey : event.ctrlKey);
    }

    function isShiftHeld(event: KeyboardEvent) {
      return shortcut.shift ? event.shiftKey : !event.shiftKey;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (isUserTyping(event.target)) return;

      const pressedKey = event.key.toLowerCase();
      const shortcutKey = shortcut.key.toLowerCase();

      if (pressedKey === shortcutKey && isModifierHeld(event) && isShiftHeld(event)) {
        event.preventDefault();
        callback();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcut, callback]);
}

export const SHORTCUTS: Record<ShortcutName, ShortcutConfig> = {
  SEE_SHORTCUTS: {
    id: 'shortcuts',
    key: '?',
    label: 'See shortcuts',
    modifier: true,
    shift: true,
  },
  TOGGLE_SIDEBAR: {
    id: 'sidebar',
    key: 'b',
    label: 'Toggle sidebar',
    modifier: true,
  },
};

function isUserTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
}
