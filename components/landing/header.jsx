"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Menu, FolderPlus, Library, LogOut, Languages, LayoutGrid } from "lucide-react"
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
  } from "@/components/ui/navigation-menu"
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/contexts/LanguageContext';

export function Header() {
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useLanguage();

  if (!t) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-white/85 backdrop-blur-xl shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)]">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Logo */}
          <Link href="/" className="flex items-center">
            <OptimizedImage 
              src="/logo2.png" 
              alt="PromptMinder" 
              width={56} 
              height={56} 
              priority
              className="rounded-lg"
            />
            <span className="hidden sm:block text-xl font-bold [-webkit-background-clip:text] [background-clip:text] text-transparent bg-gradient-to-r from-slate-900 via-slate-700 to-slate-500">
              PromptMinder
            </span>
          </Link>

          {/* Navigation & Auth */}
          <div className="flex items-center gap-6">
            {/* Center Navigation */}
            <SignedIn>
              <NavigationMenu className="hidden sm:flex">
                <NavigationMenuList className="space-x-8">
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={`${
                        pathname === '/prompts'
                          ? 'text-primary font-semibold'
                          : 'text-muted-foreground'
                      } flex items-center gap-1`}
                    >
                      <Link href="/prompts">
                        <Library className="h-4 w-4" />
                        {t.header.manage}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={`${
                        pathname === '/public'
                          ? 'text-primary font-semibold'
                          : 'text-muted-foreground'
                      } flex items-center gap-1`}
                    >
                      <Link href="/public">
                        <LayoutGrid className="h-4 w-4" />
                        {t.header.public}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </SignedIn>

            {/* Right aligned auth buttons & Language Switcher */}
            <div className="flex items-center space-x-3">
              <Button variant="outline" size="icon" onClick={toggleLanguage}>
                  <Languages className="h-5 w-5" />
              </Button>
              <SignedOut>
                <Link href="/prompts">
                  <button className="px-4 py-2 text-foreground/70 transition-colors hover:text-foreground">
                    {t.auth.login}
                  </button>
                </Link>
                <Link href="/prompts">
                  <button className="rounded-lg bg-primary px-4 py-2 text-primary-foreground shadow-[0_12px_30px_-16px_rgba(0,0,0,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-16px_rgba(0,0,0,0.45)]">
                    {t.auth.signup}
                  </button>
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
      </div>
    </header>
  );
}
