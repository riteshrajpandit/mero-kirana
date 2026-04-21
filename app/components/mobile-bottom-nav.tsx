"use client";

import Link from "next/link";

type MobileTab = "home" | "sale" | "khata" | "inventory";

type MobileBottomNavProps = {
  activeTab: MobileTab;
};

type NavItem = {
  key: MobileTab;
  label: string;
  href: string;
};

const NAV_ITEMS: NavItem[] = [
  { key: "home", label: "Home", href: "/dashboard" },
  { key: "sale", label: "Sale", href: "/transactions" },
  { key: "khata", label: "Khata", href: "/customers" },
  { key: "inventory", label: "Inventory", href: "/inventory" },
];

export function MobileBottomNav({ activeTab }: MobileBottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 bg-[#fff8ef]/90 px-4 pt-3 shadow-[0_-8px_26px_-12px_rgba(9,9,11,0.25)] backdrop-blur md:hidden [padding-bottom:max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto grid max-w-md grid-cols-4 items-center gap-1 rounded-[2rem] border border-zinc-200 bg-white p-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === activeTab;

          return (
            <Link
              key={item.key}
              href={item.href}
              className={`rounded-[1.35rem] px-2 py-2 text-center text-[11px] font-black uppercase tracking-[0.08em] transition ${
                isActive
                  ? "bg-orange-500 text-white shadow-[0_10px_24px_-16px_rgba(234,88,12,0.9)]"
                  : "text-zinc-700"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
