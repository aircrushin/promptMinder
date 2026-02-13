// @ts-nocheck
"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Library, LayoutGrid, Languages } from "lucide-react"
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!t) return null;

  return (
    <header 
      className={`fixed top-4 left-4 right-4 z-50 transition-all duration-300 ease-out ${
        scrolled 
          ? 'top-3' 
          : 'top-4'
      }`}
    >
      <div 
        className={`mx-auto max-w-6xl rounded-2xl border transition-all duration-300 ease-out ${
          scrolled 
            ? 'border-slate-200/80 bg-white/85 shadow-lg shadow-slate-900/8 backdrop-blur-xl' 
            : 'border-white/40 bg-white/70 shadow-sm backdrop-blur-xl'
        }`}
      >
        <div className="flex h-14 items-center justify-between px-5 sm:px-6">
            <Link 
              href="/" 
              className="group flex items-center gap-2.5 transition-transform duration-200 hover:scale-[1.02]"
            >
              <div className="relative">
                <OptimizedImage 
                  src="/logo2.png" 
                  alt="PromptMinder" 
                  width={36} 
                  height={36} 
                  priority
                  className="rounded-xl transition-all duration-200 group-hover:shadow-md group-hover:shadow-indigo-500/20"
                />
                <div className="absolute inset-0 rounded-xl bg-indigo-500/0 transition-colors duration-200 group-hover:bg-indigo-500/10" />
              </div>
              <span className="hidden sm:block text-lg font-bold bg-gradient-to-br from-slate-900 via-gray-800 to-slate-900 bg-clip-text text-transparent transition-all duration-200">
                PromptMinder
              </span>
            </Link>

            {/* Navigation & Auth */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* Center Navigation */}
              <SignedIn>
                <NavigationMenu className="hidden sm:flex">
                  <NavigationMenuList className="space-x-1">
                    <NavigationMenuItem>
                      <NavigationMenuLink
                        asChild
                        className={`${
                          pathname === '/prompts'
                            ? 'bg-slate-100 text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        } flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200`}
                      >
                        <Link href="/prompts" className="group/link">
                          <Library className="h-4 w-4 transition-transform duration-200 group-hover/link:scale-110" />
                          {t.header.manage}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                      <NavigationMenuLink
                        asChild
                        className={`${
                          pathname === '/public'
                            ? 'bg-slate-100 text-slate-900 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        } flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200`}
                      >
                        <Link href="/public" className="group/link">
                          <LayoutGrid className="h-4 w-4 transition-transform duration-200 group-hover/link:scale-110" />
                          {t.header.public}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </SignedIn>

              {/* Right aligned auth buttons & Language Switcher */}
              <div className="flex items-center gap-2 sm:gap-3">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleLanguage} 
                  className="h-10 w-10 rounded-xl text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 hover:scale-105"
                >
                    <Languages className="h-5 w-5 transition-transform duration-200" />
                </Button>
                <SignedOut>
                  <Link href="/prompts">
                    <button className="hidden px-4 py-2 text-sm font-semibold text-slate-600 transition-all duration-200 hover:text-slate-900 hover:bg-slate-50 rounded-xl sm:block">
                      {t.auth.login}
                    </button>
                  </Link>
                  <Link href="/prompts">
                    <button className="group relative overflow-hidden rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all duration-200 hover:shadow-xl hover:shadow-slate-900/30 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]">
                      <span className="relative z-10">{t.auth.signup}</span>
                      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-slate-800 to-slate-700 transition-transform duration-300 group-hover:translate-x-0" />
                    </button>
                  </Link>
                </SignedOut>
                <SignedIn>
                  <div className="transition-transform duration-200 hover:scale-105">
                    <UserButton afterSignOutUrl="/" appearance={{
                      elements: {
                        avatarBox: "h-9 w-9"
                      }
                    }}/>
                  </div>
                </SignedIn>
              </div>
            </div>
        </div>
      </div>
    </header>
  );
}
