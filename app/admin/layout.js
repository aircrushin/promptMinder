"use client";
import Link from "next/link";
import { Shield, LayoutDashboard, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminAuth, { useAdminAuth } from "@/components/admin/AdminAuth";

function AdminLayoutContent({ children }) {
  const { email, logout } = useAdminAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* 管理后台头部 */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                返回首页
              </Link>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <h1 className="text-lg font-semibold">管理后台</h1>
              </div>
            </div>

            {/* 导航菜单 */}
            <nav className="flex items-center gap-2">
              <Link href="/admin/contributions">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-muted transition-colors text-sm font-medium">
                  <LayoutDashboard className="w-4 h-4" />
                  贡献审核
                </div>
              </Link>
              
              {/* 管理员信息和登出 */}
              <div className="flex items-center gap-2 ml-4 pl-4 border-l">
                <span className="text-sm text-muted-foreground">{email}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  退出
                </Button>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* 权限提示横幅 */}
      <div className="bg-amber-50 dark:bg-amber-950 border-b border-amber-200 dark:border-amber-900">
        <div className="container mx-auto px-4 py-2">
          <p className="text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
            <Shield className="w-4 h-4" />
            您正在访问管理后台，请谨慎操作
          </p>
        </div>
      </div>

      {/* 主内容区 */}
      <main>{children}</main>
    </div>
  );
}

export default function AdminLayout({ children }) {
  return (
    <AdminAuth>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AdminAuth>
  );
}
