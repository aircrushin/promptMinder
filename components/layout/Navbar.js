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
} from "@/components/ui/navigation-menu";
import { Menu, Library, LayoutGrid, Languages } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
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

  const fallbackTranslations = {
    header: {
      manage: '控制台',
      public: '合集'
    },
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
    },
    auth: {
      login: '登录',
      signup: '注册'
    }
  };

  const translations = t || fallbackTranslations;

  const navItems = [
    {
      href: '/prompts',
      label: translations.header?.manage || translations.navbar.manage,
      icon: Library
    },
    {
      href: '/public',
      label: translations.header?.public || translations.navbar.public,
      icon: LayoutGrid
    }
  ];

  return (
    <nav className="border-b border-white/20 bg-white/70 backdrop-blur-xl shadow-sm">
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

        <div className="flex items-center gap-3 sm:gap-6">
          <NavigationMenu className="hidden sm:flex">
            <NavigationMenuList className="space-x-2">
              {navItems.map(({ href, label, icon: Icon }) => (
                <NavigationMenuItem key={href}>
                  <NavigationMenuLink
                    asChild
                    className={`${pathname === href
                      ? 'bg-slate-100 text-slate-900'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    } flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors`}
                  >
                    <Link href={href}>
                      <Icon className="h-4 w-4" />
                      {label}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px]">
              <SheetTitle className="sr-only">
                {translations.navbar.menuTitle}
              </SheetTitle>

              <div className="flex flex-col gap-1 pb-4 border-b">
                <p className="text-xs text-muted-foreground">
                  {translations.navbar.menuSubtitle}
                </p>
              </div>

              <div className="flex flex-col gap-6 mt-6">
                <SignedIn>
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-muted-foreground px-2">
                      {translations.navbar.teamSection}
                    </div>
                    <TeamSwitcher className="w-full" />
                  </div>
                  <div className="border-t"></div>
                </SignedIn>

                <nav className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground px-2 mb-2">
                    {translations.navbar.navigationSection}
                  </div>
                  {navItems.map(({ href, label, icon: Icon }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`${pathname === href
                        ? 'bg-primary/10 text-primary font-medium border-l-2 border-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      } flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{label}</span>
                    </Link>
                  ))}
                </nav>

                <div className="border-t"></div>

                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground px-2 mb-2">
                    {translations.navbar.settingsSection}
                  </div>
                  <Button
                    variant="ghost"
                    onClick={toggleLanguage}
                    className="w-full justify-start gap-3 px-3 py-2.5 h-auto text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <Languages className="h-4 w-4 shrink-0" />
                    <div className="flex flex-col items-start">
                      <span className="text-sm">{translations.language.switchTo}</span>
                      <span className="text-xs text-muted-foreground">({translations.language.current})</span>
                    </div>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <SignedIn>
            <TeamSwitcher className="hidden lg:block" />
          </SignedIn>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLanguage}
            className="rounded-xl text-slate-600 hover:bg-slate-100"
          >
            <Languages className="h-5 w-5" />
          </Button>

          <SignedOut>
            <SignInButton mode="modal" redirectUrl="/prompts">
              <Button variant="ghost" className="hidden px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 sm:inline-flex">
                {translations.auth?.login || '登录'}
              </Button>
            </SignInButton>
            <SignUpButton mode="modal" redirectUrl="/prompts">
              <Button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-slate-800 hover:shadow-slate-900/30">
                {translations.auth?.signup || '注册'}
              </Button>
            </SignUpButton>
          </SignedOut>

          <SignedIn>
            <UserButton appearance={{
              elements: {
                avatarBox: "h-9 w-9"
              }
            }} />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
