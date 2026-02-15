"use client";

import Link from "next/link";
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Library, LayoutGrid, Languages } from "lucide-react";
import { OptimizedImage } from "@/components/ui/optimized-image";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { useLanguage } from '@/contexts/LanguageContext';

export function Header() {
  const pathname = usePathname();
  const { toggleLanguage, t } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!t) return null;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-[border-color] duration-200 ${
        scrolled ? 'border-b border-gray-200' : 'border-b border-transparent'
      }`}
    >
      <div className="flex h-16 items-center justify-between px-5 sm:px-8 lg:px-12">
        {/* Left: Logo + Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5"
        >
          <OptimizedImage
            src="/logo2.png"
            alt="PromptMinder"
            width={32}
            height={32}
            priority
            className="rounded-lg"
          />
          <span className="hidden text-lg font-semibold text-gray-900 sm:block">
            PromptMinder
          </span>
        </Link>

        {/* Right: Nav → Language → Auth */}
        <div className="flex items-center gap-3">
          <SignedOut>
            <Link href="/sign-in">
              <Button variant="ghost" className="hidden px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 sm:inline-flex">
                {t.auth.login}
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-slate-900/30">
                {t.auth.signup}
              </Button>
            </Link>
          </SignedOut>

          <SignedIn>
            <Link
              href="/prompts"
              className={`hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 sm:flex ${
                pathname === '/prompts'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Library className="h-4 w-4" />
              {t.header.manage}
            </Link>
            <Link
              href="/public"
              className={`hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150 sm:flex ${
                pathname === '/public'
                  ? 'text-gray-900'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              {t.header.public}
            </Link>
          </SignedIn>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="h-9 w-9 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <Languages className="h-[18px] w-[18px]" />
          </Button>

          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
