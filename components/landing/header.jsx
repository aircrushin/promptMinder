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
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="mx-auto px-4">
        <div className="flex items-center justify-between h-16">
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
            <span className="hidden sm:block text-xl font-bold [-webkit-background-clip:text] [background-clip:text] text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              PromptMinder
            </span>
          </Link>

          {/* Navigation & Auth */}
          <div className="flex items-center gap-8">
            {/* Center Navigation */}
            <SignedIn>
              <NavigationMenu className="hidden sm:flex">
                <NavigationMenuList className="space-x-8">
                  <NavigationMenuItem>
                    <Link href="/prompts" legacyBehavior passHref>
                      <NavigationMenuLink
                        className={`${
                          pathname === '/prompts'
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground'
                        } flex items-center gap-1`}
                      >
                        <Library className="h-4 w-4" />
                        {t.header.manage}
                      </NavigationMenuLink>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link href="/public" legacyBehavior passHref>
                      <NavigationMenuLink
                        className={`${
                          pathname === '/public'
                            ? 'text-primary font-medium'
                            : 'text-muted-foreground'
                        } flex items-center gap-1`}
                      >
                        <LayoutGrid className="h-4 w-4" />
                        {t.header.public}
                      </NavigationMenuLink>
                    </Link>
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
                  <button className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">
                    {t.auth.login}
                  </button>
                </Link>
                <Link href="/prompts">
                  <button className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
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
      </div>
    </header>
  );
}
