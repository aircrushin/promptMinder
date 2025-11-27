"use client";

import { Toaster } from "@/components/ui/toaster";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TeamProvider } from "@/contexts/team-context";
import { AuthProvider } from "@/contexts/auth-context";
import Navbar from "@/components/layout/Navbar";
import { usePathname } from "next/navigation";
import { NO_HEADER_FOOTER_PAGES } from "@/lib/constants";

export default function Providers({ children }) {
  const pathname = usePathname();
  const shouldShowHeaderFooter = !NO_HEADER_FOOTER_PAGES.includes(pathname);

  return (
    <AuthProvider>
      <LanguageProvider>
        <TeamProvider>
          <div className="min-h-screen flex flex-col">
            {shouldShowHeaderFooter && <Navbar />}
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </TeamProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}




