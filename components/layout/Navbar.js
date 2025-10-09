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
import { Menu, FolderPlus, Library, Languages, Globe } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import { useLanguage } from '@/contexts/LanguageContext';
import { TeamSwitcher } from '@/components/team/TeamSwitcher';

export default function Navbar() {
  const pathname = usePathname();
  const { toggleLanguage, t } = useLanguage();

  useEffect(() => {
    const checkAuth = async () => {
      const hasAuthToken = document.cookie.includes('authToken=');
      if (!hasAuthToken) {
        return;
      }
    };
    checkAuth();
  }, []);

  // 如果翻译对象不可用，使用默认的中文翻译
  const safeT = t || {
    navbar: {
      manage: '提示词管理',
      new: '新建提示词',
      public: '公共库',
      menuTitle: '菜单',
      menuSubtitle: '导航菜单',
      teamSection: '团队',
      navigationSection: '导航',
      settingsSection: '设置'
    },
    language: {
      switchTo: '切换语言',
      current: '中文'
    }
  };

  return (
    <nav className="border-b">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <Link href="/" className="flex items-center group">
            <OptimizedImage 
              src="/logo2.png" 
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
                  <NavigationMenuLink
                    asChild
                    className={`${
                      pathname === '/prompts'
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                    } flex items-center gap-1`}
                  >
                    <Link href="/prompts">
                      <Library className="h-4 w-4" />
                      {safeT.navbar.manage}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                
                {/* <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={`${
                      pathname === '/prompts/new'
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                    } flex items-center gap-1`}
                  >
                    <Link href="/prompts/new">
                      <FolderPlus className="h-4 w-4" />
                      {safeT.navbar.new}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem> */}

                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={`${
                      pathname === '/public'
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground'
                    } flex items-center gap-1`}
                  >
                    <Link href="/public">
                      <Globe className="h-4 w-4" />
                      {safeT.navbar.public}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>

              </NavigationMenuList>
            </NavigationMenu>

            <div className="flex items-center ml-4 sm:ml-8 space-x-2 sm:space-x-4">
              <SignedIn>
                <TeamSwitcher className="hidden sm:block" />
              </SignedIn>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="sm:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                  <SheetTitle className="sr-only">
                    {safeT.navbar.menuTitle}
                  </SheetTitle>

                  {/* Header Section */}
                  <div className="flex flex-col gap-1 pb-4 border-b">
                    <p className="text-xs text-muted-foreground">
                      {safeT.navbar.menuSubtitle}
                    </p>
                  </div>

                  <div className="flex flex-col gap-6 mt-6">
                    {/* Team Section */}
                    <SignedIn>
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground px-2">
                          {safeT.navbar.teamSection}
                        </div>
                        <TeamSwitcher className="w-full" />
                      </div>
                      <div className="border-t"></div>
                    </SignedIn>

                    {/* Navigation Links */}
                    <nav className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground px-2 mb-2">
                        {safeT.navbar.navigationSection}
                      </div>
                      <Link
                        href="/prompts"
                        className={`${
                          pathname === '/prompts'
                            ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        } flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200`}
                      >
                        <Library className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{safeT.navbar.manage}</span>
                      </Link>
                      <Link
                        href="/prompts/new"
                        className={`${
                          pathname === '/prompts/new'
                            ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        } flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200`}
                      >
                        <FolderPlus className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{safeT.navbar.new}</span>
                      </Link>
                      <Link
                        href="/public"
                        className={`${
                          pathname === '/public'
                            ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                        } flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200`}
                      >
                        <Globe className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{safeT.navbar.public}</span>
                      </Link>
                    </nav>

                    <div className="border-t"></div>

                    {/* Settings Section */}
                    <div className="space-y-1">
                      <div className="text-xs font-medium text-muted-foreground px-2 mb-2">
                        {safeT.navbar.settingsSection}
                      </div>
                      <Button
                        variant="ghost"
                        onClick={toggleLanguage}
                        className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <Languages className="h-4 w-4 shrink-0" />
                        <div className="flex flex-col items-start">
                          <span className="text-sm">{safeT.language.switchTo}</span>
                          <span className="text-xs text-muted-foreground">({safeT.language.current})</span>
                        </div>
                      </Button>
                    </div>
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
