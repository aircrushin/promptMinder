"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Library, LayoutGrid, Languages } from "lucide-react"
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SignedIn, SignedOut, UserButton } from "@/components/auth";
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
  const { toggleLanguage, t } = useLanguage();

  if (!t) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/20 bg-white/70 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <OptimizedImage 
              src="/logo2.png" 
              alt="PromptMinder" 
              width={40} 
              height={40} 
              priority
              className="rounded-xl"
            />
            <span className="hidden sm:block text-xl font-bold [-webkit-background-clip:text] [background-clip:text] text-transparent bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
              PromptMinder
            </span>
          </Link>

          {/* Navigation & Auth */}
          <div className="flex items-center gap-6">
            {/* Center Navigation */}
            <SignedIn>
              <NavigationMenu className="hidden sm:flex">
                <NavigationMenuList className="space-x-2">
                  <NavigationMenuItem>
                    <NavigationMenuLink
                      asChild
                      className={`${
                        pathname === '/prompts'
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      } flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors`}
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
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      } flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors`}
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
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleLanguage} className="rounded-xl text-slate-600 hover:bg-slate-100">
                  <Languages className="h-5 w-5" />
              </Button>
              <SignedOut>
                <Link href="/prompts">
                  <button className="hidden px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:text-slate-900 sm:block">
                    {t.auth.login}
                  </button>
                </Link>
                <Link href="/prompts">
                  <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-slate-900/30 hover:-translate-y-0.5">
                    {t.auth.signup}
                  </button>
                </Link>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" appearance={{
                  elements: {
                    avatarBox: "h-9 w-9"
                  }
                }}/>
              </SignedIn>
            </div>
          </div>
      </div>
    </header>
  );
}
