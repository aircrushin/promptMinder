'use client';

import { useEffect } from 'react';
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';
import { THEME_BOOTSTRAP_SCRIPT, THEME_COLORS, THEME_STORAGE_KEY, THEMES } from '@/lib/theme';

function ThemeSync() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    if (theme && !THEMES.includes(theme)) setTheme('system');
  }, [theme, setTheme]);

  useEffect(() => {
    if (!THEME_COLORS[resolvedTheme]) return;
    // Own this tag outside React metadata so pre-paint updates do not duplicate it during hydration.
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = THEME_COLORS[resolvedTheme];
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children }) {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      <NextThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey={THEME_STORAGE_KEY}
        themes={THEMES.filter((theme) => theme !== 'system')}
      >
        <ThemeSync />
        {children}
      </NextThemeProvider>
    </>
  );
}
