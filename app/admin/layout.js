"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ArrowLeft, LogOut, Globe, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminAuth, { useAdminAuth } from "@/components/admin/AdminAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  SidebarRail,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

function AdminSidebar() {
  const pathname = usePathname();
  const { email, logout } = useAdminAuth();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="h-auto py-3">
              <Link href="/admin" className="flex items-center gap-3">
                <div className="relative flex aspect-square size-10 items-center justify-center rounded-xl overflow-hidden shrink-0 shadow-sm">
                  <Image
                    src="/logo.svg"
                    alt="Prompt Manage"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate font-semibold text-base">Prompt Manage</span>
                  <span className="truncate text-xs text-muted-foreground">Admin Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent className="space-y-1">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname?.startsWith("/admin/contributions")} 
                  tooltip="贡献审核"
                  className={cn(
                    "h-12 text-base transition-all duration-200 rounded-lg my-1",
                    "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium",
                    "hover:bg-muted hover:translate-x-0.5"
                  )}
                >
                  <Link href="/admin/contributions" className="gap-4">
                    <LayoutDashboard className="size-5" />
                    <span>贡献审核</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname?.startsWith("/admin/public-prompts")} 
                  tooltip="公开提示词"
                  className={cn(
                    "h-12 text-base transition-all duration-200 rounded-lg my-1",
                    "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium",
                    "hover:bg-muted hover:translate-x-0.5"
                  )}
                >
                  <Link href="/admin/public-prompts" className="gap-4">
                    <Globe className="size-5" />
                    <span>公开提示词</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname?.startsWith("/admin/feedback")} 
                  tooltip="用户反馈"
                  className={cn(
                    "h-12 text-base transition-all duration-200 rounded-lg my-1",
                    "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:font-medium",
                    "hover:bg-muted hover:translate-x-0.5"
                  )}
                >
                  <Link href="/admin/feedback" className="gap-4">
                    <MessageSquare className="size-5" />
                    <span>用户反馈</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-2 pb-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              asChild 
              tooltip="返回首页"
              className="h-11 text-base rounded-lg hover:bg-muted hover:translate-x-0.5 transition-all duration-200"
            >
              <Link href="/" className="gap-4">
                <ArrowLeft className="size-5" />
                <span>返回首页</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarSeparator className="my-3" />
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50 group-data-[collapsible=icon]:hidden">
           <div className="flex flex-col px-1 overflow-hidden">
               <span className="text-xs text-muted-foreground truncate" title={email}>{email}</span>
           </div>
           <Button variant="ghost" size="icon" onClick={logout} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 rounded-lg">
               <LogOut className="h-4 w-4" />
               <span className="sr-only">退出</span>
           </Button>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}

function AdminLayoutContent({ children }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
             <span>管理后台</span>
          </div>
        </header>
        <div className="flex-1 p-4 pt-0">
            {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminAuth>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuth>
  );
}
