"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type MobileTab = "home" | "sale" | "khata" | "inventory";

type MobileBottomNavProps = {
  activeTab: MobileTab;
};

type NavItem = {
  key: MobileTab;
  label: string;
  href: string;
  icon: (isActive: boolean) => ReactNode;
};

const NAV_ITEMS: NavItem[] = [
  {
    key: "home",
    label: "Home",
    href: "/dashboard",
    icon: (isActive) => (
      <svg
        viewBox="0 0 24 24"
        className="h-6 w-6 fill-none stroke-current"
        strokeWidth={isActive ? "2.5" : "2.2"}
      >
        <path d="M4 10L12 4l8 6" />
        <path d="M6 10v10h12V10" />
      </svg>
    ),
  },
  {
    key: "sale",
    label: "Sale",
    href: "/transactions",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2.2">
        <path d="M4 7h16" />
        <path d="M7 7l2 10h8l2-10" />
        <circle cx="10" cy="20" r="1.4" />
        <circle cx="16" cy="20" r="1.4" />
      </svg>
    ),
  },
  {
    key: "khata",
    label: "Khata",
    href: "/customers",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2.2">
        <path d="M5 5h12a2 2 0 012 2v12H7a2 2 0 01-2-2z" />
        <path d="M9 9h6" />
        <path d="M9 13h6" />
      </svg>
    ),
  },
  {
    key: "inventory",
    label: "Inventory",
    href: "/inventory",
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2.2">
        <path d="M4 7h16v13H4z" />
        <path d="M8 7V4h8v3" />
      </svg>
    ),
  },
];

export function MobileBottomNav({ activeTab }: MobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 md:hidden">
      <div className="mx-auto max-w-3xl px-4">
        <div className="rounded-t-[2.2rem] border border-zinc-200 bg-[#eef1ea] px-3 pt-3 shadow-[0_-10px_30px_-18px_rgba(9,9,11,0.28)] [padding-bottom:max(0.9rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-4 items-end gap-2">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeTab;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`flex min-h-20 flex-col items-center justify-center rounded-[2rem] px-2 text-center transition ${
                isActive
                  ? "bg-orange-500 text-white shadow-[0_14px_24px_-16px_rgba(234,88,12,0.95)]"
                  : "text-zinc-700"
              }`}
            >
              <span className="mb-1">{item.icon(isActive)}</span>
              <span className="text-[0.68rem] font-black uppercase tracking-[0.09em]">
                {item.label}
              </span>
            </Link>
          );
        })}
          </div>
        </div>
      </div>
    </nav>
  );
}
