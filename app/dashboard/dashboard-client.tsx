"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useLiveQuery } from "dexie-react-hooks";

import { MobileBottomNav } from "@/app/components/mobile-bottom-nav";
import { db } from "@/lib/offline/db";
import { useSync } from "@/lib/sync/useSync";

const currency = new Intl.NumberFormat("en-NP", {
  style: "currency",
  currency: "NPR",
  maximumFractionDigits: 0,
});

type DashboardClientProps = {
  shopId: string;
  userName: string;
};

export default function DashboardClient({
  shopId,
  userName,
}: DashboardClientProps) {
  const { isSyncing, syncNow } = useSync(shopId);

  const transactions = useLiveQuery(async () => {
    const rows = await db.transactions.where("shopId").equals(shopId).toArray();
    return rows.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }, [shopId]);

  const todayStats = useMemo(() => {
    if (!transactions) {
      return {
        totalSalesPaisa: 0,
        cashReceivedPaisa: 0,
        creditGivenPaisa: 0,
      };
    }

    const todayKey = new Date().toLocaleDateString("en-CA");

    return transactions.reduce(
      (totals, transaction) => {
        const txnDay = new Date(transaction.occurredAt).toLocaleDateString("en-CA");

        if (txnDay !== todayKey) {
          return totals;
        }

        if (transaction.type === "CASH" || transaction.type === "CREDIT") {
          totals.totalSalesPaisa += transaction.amountPaisa;
        }

        if (transaction.type === "CASH" || transaction.type === "PAYMENT") {
          totals.cashReceivedPaisa += transaction.amountPaisa;
        }

        if (transaction.type === "CREDIT") {
          totals.creditGivenPaisa += transaction.amountPaisa;
        }

        return totals;
      },
      {
        totalSalesPaisa: 0,
        cashReceivedPaisa: 0,
        creditGivenPaisa: 0,
      },
    );
  }, [transactions]);

  const syncLabel = isSyncing ? "Online & Syncing" : "All data synced";
  const lowStockItems = [
    { id: "milk", name: "Milk", left: "2 left" },
    { id: "sugar", name: "Sugar", left: "5kg left" },
  ];

  return (
    <>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-7 px-4 py-4 pb-36 sm:px-5">
        <section className="rounded-none border border-zinc-100 bg-white/70 px-5 py-5 shadow-sm sm:rounded-[0.25rem]">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full text-emerald-800"
              aria-label="Menu"
            >
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2.4">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h1 className="text-[2.55rem] font-black tracking-tight text-emerald-800">Mero Kirana</h1>
            <span className="sr-only">Signed in as {userName}</span>
            <button
              type="button"
              onClick={() => {
                void syncNow();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100 px-4 py-2 text-xs font-bold text-emerald-900"
            >
              <span className="grid h-4 w-4 place-items-center rounded-full bg-emerald-900 text-white">
                <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current" strokeWidth="3">
                  <path d="M6 12l4 4 8-8" />
                </svg>
              </span>
              {syncLabel}
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="px-2 text-[2.05rem] font-black tracking-tight text-zinc-900">Today&apos;s Overview</h2>

          <article className="rounded-[2.7rem] border border-zinc-100 bg-white px-8 py-6 shadow-sm">
            <div className="flex items-start justify-between">
              <p className="text-[1.1rem] font-medium text-zinc-700">Today&apos;s Sales</p>
              <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-emerald-800">
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2.4">
                  <path d="M7 17L17 7" />
                  <path d="M10 7h7v7" />
                </svg>
              </span>
            </div>
            <p className="mt-4 text-[4.1rem] font-black leading-none tracking-tight text-zinc-900">
              {currency.format(todayStats.totalSalesPaisa / 100).replace("NPR", "Rs.")}
            </p>
          </article>

          <div className="grid grid-cols-2 gap-3">
            <article className="rounded-[2.2rem] border border-zinc-100 bg-[#f2f4ef] px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-red-100 text-red-700">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.2">
                    <path d="M5 7h14v10H5z" />
                    <path d="M9 11h6" />
                  </svg>
                </span>
                <p className="text-[1rem] font-medium text-zinc-700">Credit Given</p>
              </div>
              <p className="mt-3 text-[2.2rem] font-black tracking-tight text-zinc-900">
                {currency.format(todayStats.creditGivenPaisa / 100).replace("NPR", "Rs.")}
              </p>
            </article>

            <article className="rounded-[2.2rem] border border-zinc-100 bg-[#f2f4ef] px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-orange-100 text-orange-700">
                  <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="2.2">
                    <path d="M4 7h16v10H4z" />
                    <path d="M8 11h8" />
                    <path d="M8 14h4" />
                  </svg>
                </span>
                <p className="text-[1rem] font-medium text-zinc-700">Cash Received</p>
              </div>
              <p className="mt-3 text-[2.2rem] font-black tracking-tight text-zinc-900">
                {currency.format(todayStats.cashReceivedPaisa / 100).replace("NPR", "Rs.")}
              </p>
            </article>
          </div>
        </section>

        <section className="space-y-3">
          <Link
            href="/transactions"
            className="flex min-h-20 items-center justify-between rounded-[3rem] bg-gradient-to-r from-orange-500 to-orange-400 px-6 text-white shadow-[0_16px_34px_-20px_rgba(249,115,22,0.85)]"
          >
            <div className="flex items-center gap-4">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/20">
                <svg viewBox="0 0 24 24" className="h-8 w-8 fill-none stroke-current" strokeWidth="2.2">
                  <path d="M7 4h10v16H7z" />
                  <path d="M7 9h10" />
                  <path d="M10 13h4" />
                  <path d="M10 16h4" />
                </svg>
              </span>
              <span className="text-[2rem] font-black tracking-tight">New Sale</span>
            </div>
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white/70 text-orange-500">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2.8">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </Link>

          <div className="grid grid-cols-2 gap-3">
            <Link
              href="/customers"
              className="grid min-h-20 place-items-center rounded-[2.6rem] bg-emerald-800 text-[2rem] font-black text-white shadow-[0_14px_28px_-18px_rgba(6,95,70,0.8)]"
            >
              Add Credit
            </Link>
            <Link
              href="/transactions"
              className="grid min-h-20 place-items-center rounded-[2.6rem] border border-zinc-200 bg-[#f2f4ef] text-[2rem] font-black text-zinc-900"
            >
              Receive Payment
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[2rem] font-black tracking-tight text-zinc-900">Low Stock Alert</h3>
            <Link href="/inventory" className="text-[1.4rem] font-bold text-emerald-800">
              View All
            </Link>
          </div>
          <div className="rounded-[2rem] border border-zinc-100 bg-[#eef1ea] p-3 shadow-sm">
            {lowStockItems.map((item) => (
              <article
                key={item.id}
                className="mb-3 flex items-center justify-between rounded-[2.2rem] bg-white px-4 py-4 last:mb-0"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-14 w-14 place-items-center rounded-full bg-purple-100 text-purple-800">
                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current" strokeWidth="2.1">
                      <path d="M6 8h12v11H6z" />
                      <path d="M9 8V5h6v3" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-[2rem] font-black tracking-tight text-zinc-900">{item.name}</p>
                    <p className="text-[1.5rem] font-medium text-purple-800">{item.left}</p>
                  </div>
                </div>
                <button
                  type="button"
                  className="rounded-full bg-[#ecefe8] px-5 py-2 text-[1.5rem] font-semibold text-zinc-700"
                >
                  Restock
                </button>
              </article>
            ))}
          </div>
        </section>
      </main>

      <MobileBottomNav activeTab="home" />
    </>
  );
}