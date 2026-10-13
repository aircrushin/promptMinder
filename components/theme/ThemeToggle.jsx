'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { THEMES } from '@/lib/theme';

const icons = { light: Sun, dark: Moon, system: Monitor };

export function ThemeToggle({ className, showLabel = false }) {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const selectedTheme = mounted && THEMES.includes(theme) ? theme : 'system';
  const Icon = icons[selectedTheme];
  const copy = t.theme;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={showLabel ? 'default' : 'icon'}
          aria-label={copy.label}
          title={copy.label}
          disabled={!mounted}
          className={cn('shrink-0 text-muted-foreground hover:text-foreground', showLabel && 'w-full justify-start gap-3', className)}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          {showLabel && <span>{copy.label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{copy.label}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={selectedTheme} onValueChange={setTheme}>
          {THEMES.map((value) => {
            const OptionIcon = icons[value];
            return (
              <DropdownMenuRadioItem key={value} value={value} className="gap-2">
                <OptionIcon className="h-4 w-4" aria-hidden="true" />
                {copy[value]}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
