'use client';
import Link from 'next/link';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, FolderPlus, Library, LogOut, Languages, Globe } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ClerkProvider, SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { useLanguage } from '@/contexts/LanguageContext';

export default function Navbar() {
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    const checkAuth = async () => {
      const hasAuthToken = document.cookie.includes('authToken=');
      if (!hasAuthToken) {
        return;
      }
    };
    checkAuth();
  }, []);

  if (!t) return null;

  return (
    <nav className="border-b">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <Link href="/" className="flex items-center group">
            <OptimizedImage 
              src="/logo.svg" 
              alt="PromptMinder" 
              width={56} 
              height={56} 
              priority
              className="rounded-lg"
            />
            <span className="hidden sm:block text-xl font-bold bg-gradient-to-r from-primary/90 to-primary [-webkit-background-clip:text] [background-clip:text] text-transparent hover:from-primary hover:to-primary/90 transition-all duration-300">
              PromptMinder
            </span>
          </Link>

          <div className="flex items-center">
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
                      {t.navbar.manage}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                
                <NavigationMenuItem>
                  <Link href="/prompts/new" legacyBehavior passHref>
                    <NavigationMenuLink
                      className={`${
                        pathname === '/prompts/new'
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground'
                      } flex items-center gap-1`}
                    >
                      <FolderPlus className="h-4 w-4" />
                      {t.navbar.new}
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
                      <Globe className="h-4 w-4" />
                      {t.navbar.public}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>

              </NavigationMenuList>
            </NavigationMenu>

            <div className="flex items-center ml-4 sm:ml-8 space-x-2 sm:space-x-4">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="sm:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[260px]">
                  <SheetTitle className="sr-only">
                    {t.navbar?.menuTitle || 'Navigation menu'}
                  </SheetTitle>
                  <div className="flex flex-col gap-4 mt-6">
                    <Link
                      href="/prompts"
                      className={`${
                        pathname === '/prompts'
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground'
                      } flex items-center gap-2`}
                    >
                      <Library className="h-4 w-4" />
                      {t.navbar.manage}
                    </Link>
                    <Link
                      href="/prompts/new"
                      className={`${
                        pathname === '/prompts/new'
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground'
                      } flex items-center gap-2`}
                    >
                      <FolderPlus className="h-4 w-4" />
                      {t.navbar.new}
                    </Link>
                    <Link
                      href="/public"
                      className={`${
                        pathname === '/public'
                          ? 'text-primary font-medium'
                          : 'text-muted-foreground'
                      } flex items-center gap-2`}
                    >
                      <Globe className="h-4 w-4" />
                      {t.navbar.public}
                    </Link>
                    <Button
                      variant="ghost"
                      onClick={toggleLanguage}
                      className="justify-start"
                    >
                      <Languages className="h-4 w-4 mr-2" />
                      {t.language.switchTo} ({t.language.current})
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>

              <Button variant="outline" size="icon" onClick={toggleLanguage} className="hidden sm:inline-flex">
                <Languages className="h-5 w-5" />
              </Button>
              <SignedOut>
                <SignInButton />
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 
