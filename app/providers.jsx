'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { zhCN } from '@clerk/localizations';
import { useTheme } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { Analytics } from '@vercel/analytics/next';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { TeamProvider } from '@/contexts/team-context';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import Navbar from '@/components/layout/Navbar';
import { usePathname } from 'next/navigation';
import { NO_HEADER_FOOTER_PAGES } from '@/lib/constants';

function ThemedProviders({ children }) {
  const pathname = usePathname();
  const { resolvedTheme } = useTheme();
  const shouldShowHeaderFooter = !NO_HEADER_FOOTER_PAGES.includes(pathname);

  return (
    <ClerkProvider
      localization={zhCN}
      appearance={{
        baseTheme: resolvedTheme === 'dark' ? dark : undefined,
        layout: { unsafe_disableDevelopmentModeWarnings: true },
        elements: {
          formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90 transition-colors',
          headerTitle: 'text-2xl font-bold text-foreground',
          headerSubtitle: 'text-muted-foreground',
          socialButtonsBlockButton: 'border border-border text-foreground hover:bg-accent transition-colors',
          formFieldInput: 'rounded-lg border-input focus:border-ring focus:ring-ring',
          footerActionLink: 'text-foreground hover:text-muted-foreground transition-colors',
          dividerLine: 'bg-border',
          dividerText: 'text-muted-foreground',
          formFieldLabel: 'font-medium text-foreground',
        },
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorBackground: 'hsl(var(--card))',
          colorInputBackground: 'hsl(var(--background))',
          colorInputText: 'hsl(var(--foreground))',
          colorText: 'hsl(var(--foreground))',
          colorTextSecondary: 'hsl(var(--muted-foreground))',
          fontFamily: 'Inter, sans-serif',
          borderRadius: '0.5rem',
        },
      }}
    >
      <LanguageProvider>
        <TeamProvider>
          <div className="min-h-screen flex flex-col">
            {shouldShowHeaderFooter && <Navbar />}
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
          <Analytics />
        </TeamProvider>
      </LanguageProvider>
    </ClerkProvider>
  );
}

export default function Providers({ children }) {
  return <ThemeProvider><ThemedProviders>{children}</ThemedProviders></ThemeProvider>;
}
