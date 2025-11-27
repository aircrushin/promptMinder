"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Shield, User, Loader2, AlertCircle } from "lucide-react";

export default function AdminAuth({ children }) {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // 检查是否已经验证
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const savedUsername = localStorage.getItem("admin_username");

    if (token && savedUsername) {
      // 验证 token 是否仍然有效
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token) => {
    try {
      const response = await fetch(`/api/admin/verify?token=${encodeURIComponent(token)}`);
      if (response.ok) {
        setIsVerified(true);
      } else {
        // Token 无效，清除本地存储
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_username");
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_username");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsVerifying(true);

    try {
      const response = await fetch("/api/admin/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (response.ok) {
        // 保存 token 和用户名到 localStorage
        localStorage.setItem("admin_token", data.token);
        localStorage.setItem("admin_username", data.username);
        setIsVerified(true);
      } else {
        setError(data.error || "验证失败");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setError("验证失败，请重试");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_username");
    setIsVerified(false);
    setUsername("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">验证中...</p>
        </div>
      </div>
    );
  }

  if (!isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <Shield className="w-8 h-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">管理后台验证</CardTitle>
            <CardDescription>
              请输入您的管理员用户名以访问审核后台
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="pl-10"
                    disabled={isVerifying}
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isVerifying || !username.trim()}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    验证中...
                  </>
                ) : (
                  "验证并进入"
                )}
              </Button>
            </form>

            <div className="mt-6 p-3 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground text-center">
                💡 提示：只有管理员用户名才能访问此页面
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 已验证，显示子组件并提供登出功能
  return (
    <>
      {children}
      {/* 可以添加一个浮动的登出按钮或在导航栏中添加 */}
    </>
  );
}

// 导出一个可以在其他地方使用的 Hook
export function useAdminAuth() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const savedUsername = localStorage.getItem("admin_username");
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_username");
    window.location.reload();
  };

  return { username, logout };
}
