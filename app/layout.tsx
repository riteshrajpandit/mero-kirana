import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import Link from "next/link";

import { LogoutButton } from "@/app/components/logout-button";
import { PwaRegister } from "@/app/components/pwa-register";
import { GlobalErrorBoundary } from "@/app/components/global-error-boundary";
import { tryGetSessionFromRequestCookies } from "@/server/auth/session";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mero Kirana",
  description: "Offline-first POS and khata management for small grocery stores",
  manifest: "/manifest.webmanifest",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await tryGetSessionFromRequestCookies();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-gradient-to-b from-orange-50 via-amber-50 to-zinc-100 text-zinc-950">
        <GlobalErrorBoundary>
          <PwaRegister />
          <header className="sticky top-0 z-40 hidden border-b border-orange-200/70 bg-white/90 backdrop-blur md:block">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
              <Link href="/dashboard" className="text-lg font-bold tracking-tight text-zinc-900">
                Mero Kirana
              </Link>
              <nav className="flex items-center gap-2 sm:gap-3">
                {session ? (
                  <>
                    <div className="hidden items-center gap-2 md:flex">
                      <Link
                        href="/transactions"
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-orange-100"
                      >
                        Sale
                      </Link>
                      <Link
                        href="/customers"
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-orange-100"
                      >
                        Khata
                      </Link>
                      <Link
                        href="/inventory"
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-orange-100"
                      >
                        Inventory
                      </Link>
                    </div>
                    <span className="hidden text-sm font-medium text-zinc-600 lg:inline">
                      {session.name}
                    </span>
                    <LogoutButton />
                  </>
                ) : (
                  <Link
                    href="/login"
                    className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
                  >
                    Login
                  </Link>
                )}
              </nav>
            </div>
          </header>
          <div className="flex min-h-screen flex-col md:min-h-[calc(100vh-64px)]">{children}</div>
        </GlobalErrorBoundary>
      </body>
    </html>
  );
}
