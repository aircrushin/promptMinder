"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { light } from "@clerk/themes";
import { zhCN } from "@clerk/localizations";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/next";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TeamProvider } from "@/contexts/team-context";
import Navbar from "@/components/layout/Navbar";
import { usePathname } from "next/navigation";
import { NO_HEADER_FOOTER_PAGES } from "@/lib/constants";

export default function Providers({ children }) {
  const pathname = usePathname();
  const shouldShowHeaderFooter = !NO_HEADER_FOOTER_PAGES.includes(pathname);

  return (
    <ClerkProvider
      localization={zhCN}
      appearance={{
        layout: {
          unsafe_disableDevelopmentModeWarnings: true,
          socialButtonsIconButton: "hover:bg-gray-100",
        },
        elements: {
          formButtonPrimary: "bg-black hover:bg-black/90 transition-colors",
          headerTitle: "text-2xl font-bold text-gray-900",
          headerSubtitle: "text-gray-600",
          socialButtonsBlockButton:
            "border border-gray-200 hover:bg-gray-50 transition-colors",
          formFieldInput:
            "rounded-lg border-gray-200 focus:border-black focus:ring-black",
          footerActionLink: "text-black hover:text-gray-600 transition-colors",
          dividerLine: "bg-gray-200",
          dividerText: "text-gray-500",
          formFieldLabel: "font-medium text-gray-700",
        },
        variables: {
          colorPrimary: "#000000",
          colorBackground: "#ffffff",
          colorInputBackground: "#ffffff",
          colorInputText: "#000000",
          colorTextSecondary: "#4B5563",
          fontFamily: "Inter, sans-serif",
          borderRadius: "0.5rem",
        },
        baseTheme: light,
      }}
    >
      <LanguageProvider>
        <TeamProvider>
          <div className="min-h-screen flex flex-col">
            {shouldShowHeaderFooter && <Navbar />}
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
          <Analytics />
        </TeamProvider>
      </LanguageProvider>
    </ClerkProvider>
  );
}




