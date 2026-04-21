"use client";

import { useMemo, useState } from "react";

import { useLiveQuery } from "dexie-react-hooks";

import { MobileBottomNav } from "@/app/components/mobile-bottom-nav";
import { db } from "@/lib/offline/db";
import { createLocalTransaction } from "@/lib/offline/mutations";
import { useSync } from "@/lib/sync/useSync";
import type { TransactionType } from "@/types/shared";

const currency = new Intl.NumberFormat("en-NP", {
  style: "currency",
  currency: "NPR",
  maximumFractionDigits: 0,
});

type QuickItem = {
  id: string;
  name: string;
  priceRupees: number;
  accent: string;
};

const QUICK_ITEMS: QuickItem[] = [
  { id: "bread", name: "Bread", priceRupees: 50, accent: "bg-orange-100 text-orange-700" },
  { id: "milk", name: "Milk", priceRupees: 45, accent: "bg-emerald-100 text-emerald-700" },
  { id: "egg", name: "Egg", priceRupees: 20, accent: "bg-yellow-100 text-yellow-700" },
  { id: "coke", name: "Coke", priceRupees: 80, accent: "bg-red-100 text-red-700" },
  {
    id: "biscuits",
    name: "Biscuits",
    priceRupees: 30,
    accent: "bg-amber-100 text-amber-700",
  },
  { id: "noodles", name: "Noodles", priceRupees: 35, accent: "bg-blue-100 text-blue-700" },
];

type CheckoutStep = "sale" | "customer" | "payment";

type TransactionsClientProps = {
  shopId: string;
};

export default function TransactionsClient({ shopId }: TransactionsClientProps) {
  const { isOnline, isSyncing, syncNow } = useSync(shopId);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [step, setStep] = useState<CheckoutStep>("sale");
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [customAmount, setCustomAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const customers = useLiveQuery(async () => {
    const rows = await db.customers.where("shopId").equals(shopId).toArray();
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [shopId]);

  const transactions = useLiveQuery(async () => {
    const rows = await db.transactions.where("shopId").equals(shopId).toArray();
    return rows.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }, [shopId]);

  const selectedCustomer = useMemo(() => {
    if (!customerId) {
      return null;
    }

    return (customers ?? []).find((customer) => customer.id === customerId) ?? null;
  }, [customerId, customers]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();

    if (!q) {
      return customers ?? [];
    }

    return (customers ?? []).filter((customer) => {
      const byName = customer.name.toLowerCase().includes(q);
      const byPhone = customer.phone?.toLowerCase().includes(q) ?? false;
      return byName || byPhone;
    });
  }, [customerSearch, customers]);

  const cartItems = useMemo(() => {
    return QUICK_ITEMS.filter((item) => (cart[item.id] ?? 0) > 0).map((item) => ({
      ...item,
      qty: cart[item.id],
      lineTotalRupees: cart[item.id] * item.priceRupees,
    }));
  }, [cart]);

  const quickTotalRupees = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.lineTotalRupees, 0);
  }, [cartItems]);

  const customAmountRupees = useMemo(() => {
    const parsed = Number(customAmount);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : 0;
  }, [customAmount]);

  const totalRupees = quickTotalRupees + customAmountRupees;
  const totalPaisa = totalRupees * 100;

  const recentTransactions = useMemo(() => {
    return (transactions ?? []).slice(0, 6);
  }, [transactions]);

  const onAddItem = (itemId: string) => {
    setCart((current) => ({ ...current, [itemId]: (current[itemId] ?? 0) + 1 }));
  };

  const onSubtractItem = (itemId: string) => {
    setCart((current) => {
      const nextQty = Math.max(0, (current[itemId] ?? 0) - 1);
      return { ...current, [itemId]: nextQty };
    });
  };

  const resetCheckout = () => {
    setCart({});
    setCustomAmount("");
    setStep("sale");
  };

  const onSaveTransaction = async (type: TransactionType) => {
    if (!totalPaisa || isSaving) {
      return;
    }

    if (type === "CREDIT" && !customerId) {
      setStep("customer");
      return;
    }

    setIsSaving(true);

    try {
      const noteParts = cartItems.map((item) => `${item.name}x${item.qty}`);
      if (customAmountRupees > 0) {
        noteParts.push(`Custom Rs ${customAmountRupees}`);
      }

      await createLocalTransaction({
        shopId,
        amountPaisa: totalPaisa,
        type,
        customerId: customerId || undefined,
        note: noteParts.join(", "),
      });

      resetCheckout();
    } finally {
      setIsSaving(false);
    }
  };

  const onContinue = async () => {
    if (!totalPaisa) {
      return;
    }

    if (step === "sale") {
      setStep("customer");
      return;
    }

    if (step === "customer") {
      setStep("payment");
      return;
    }

    await onSaveTransaction("CASH");
  };

  return (
    <>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6 pb-48 sm:px-6 lg:px-8">
        <section className="rounded-[1.8rem] border border-zinc-200 bg-white p-5 shadow-[0_18px_48px_-30px_rgba(9,9,11,0.45)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500">Quick Sale</p>
              <h1 className="mt-1 text-4xl font-black tracking-tight text-zinc-900">
                {currency.format(totalRupees)}
              </h1>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isOnline ? (isSyncing ? "animate-pulse bg-orange-500" : "bg-emerald-500") : "bg-red-500"
                }`}
              />
              <span className="text-xs font-black uppercase tracking-[0.1em] text-zinc-600">
                {isOnline ? (isSyncing ? "Syncing" : "Online") : "Offline"}
              </span>
              <button
                type="button"
                onClick={() => {
                  void syncNow();
                }}
                disabled={!isOnline || isSyncing}
                className="rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.08em] text-zinc-700 disabled:opacity-50"
              >
                Sync
              </button>
            </div>
          </div>

          <label className="mt-4 block text-xs font-black uppercase tracking-[0.12em] text-zinc-600">
            Extra Amount
          </label>
          <input
            className="mt-2 min-h-11 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none ring-orange-300 transition focus:ring-2"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
            placeholder="Optional custom rupees"
            inputMode="numeric"
          />
        </section>

        <section className="rounded-[1.4rem] border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-600">Quick Add</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {QUICK_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onAddItem(item.id)}
                className="aspect-square rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-left transition active:scale-[0.98]"
              >
                <div
                  className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] ${item.accent}`}
                >
                  {item.name.slice(0, 1)}
                </div>
                <p className="mt-3 text-sm font-black text-zinc-900">{item.name}</p>
                <p className="text-xs text-zinc-600">Rs {item.priceRupees}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-[1.4rem] border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-600">Current Items</h2>
            <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-zinc-700">
              {cartItems.reduce((count, item) => count + item.qty, 0)} items
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {cartItems.length === 0 ? (
              <p className="rounded-xl bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
                Add products to start the sale.
              </p>
            ) : (
              cartItems.map((item) => (
                <article
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-black text-zinc-900">{item.name}</p>
                    <p className="text-xs text-zinc-600">
                      Rs {item.priceRupees} each • {currency.format(item.lineTotalRupees)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-zinc-100 px-2 py-1">
                    <button
                      type="button"
                      onClick={() => onSubtractItem(item.id)}
                      className="h-8 w-8 rounded-full bg-white text-lg font-black text-zinc-700"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-sm font-black text-zinc-900">{item.qty}</span>
                    <button
                      type="button"
                      onClick={() => onAddItem(item.id)}
                      className="h-8 w-8 rounded-full bg-white text-lg font-black text-zinc-700"
                    >
                      +
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {step === "customer" ? (
          <section className="rounded-[1.4rem] border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-600">
                Select Customer
              </h2>
              <button
                type="button"
                onClick={() => setStep("sale")}
                className="rounded-full border border-zinc-300 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-zinc-700"
              >
                Back
              </button>
            </div>

            <input
              className="mt-3 min-h-11 w-full rounded-xl border border-zinc-300 bg-zinc-50 px-3 text-sm text-zinc-900 outline-none ring-orange-300 transition focus:ring-2"
              value={customerSearch}
              onChange={(event) => setCustomerSearch(event.target.value)}
              placeholder="Search customer"
            />

            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={() => setCustomerId("")}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  !customerId
                    ? "border-orange-300 bg-orange-50"
                    : "border-zinc-200 bg-white hover:bg-zinc-50"
                }`}
              >
                <p className="text-sm font-black text-zinc-900">Walk-in Customer</p>
                <p className="text-xs text-zinc-600">No khata account attached</p>
              </button>

              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setCustomerId(customer.id)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                    customerId === customer.id
                      ? "border-orange-300 bg-orange-50"
                      : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <p className="text-sm font-black text-zinc-900">{customer.name}</p>
                  <p className="text-xs text-zinc-600">
                    {customer.phone || "No phone"} • Due {currency.format(customer.creditBalancePaisa / 100)}
                  </p>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {step === "payment" ? (
          <section className="rounded-[1.4rem] border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-600">
                Payment Options
              </h2>
              <button
                type="button"
                onClick={() => setStep("customer")}
                className="rounded-full border border-zinc-300 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-zinc-700"
              >
                Back
              </button>
            </div>

            <div className="mt-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-zinc-500">Customer</p>
              <p className="mt-1 text-sm font-black text-zinc-900">
                {selectedCustomer ? selectedCustomer.name : "Walk-in Customer"}
              </p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  void onSaveTransaction("CASH");
                }}
                className="min-h-12 rounded-xl bg-emerald-700 px-4 text-sm font-black uppercase tracking-[0.08em] text-white"
                disabled={isSaving}
              >
                Instant Payment
              </button>
              <button
                type="button"
                onClick={() => {
                  void onSaveTransaction("CREDIT");
                }}
                className="min-h-12 rounded-xl bg-orange-500 px-4 text-sm font-black uppercase tracking-[0.08em] text-white"
                disabled={isSaving}
              >
                Add to Khata
              </button>
            </div>
          </section>
        ) : null}

        <section className="rounded-[1.4rem] border border-zinc-200 bg-white p-4 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-600">Recent Sales</h2>
          <div className="mt-3 space-y-2">
            {recentTransactions.length === 0 ? (
              <p className="rounded-xl bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
                No transactions yet.
              </p>
            ) : (
              recentTransactions.map((transaction) => (
                <article
                  key={transaction.id}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-3"
                >
                  <div>
                    <p className="text-sm font-black text-zinc-900">{transaction.type}</p>
                    <p className="text-xs text-zinc-500">
                      {new Date(transaction.occurredAt).toLocaleString("en-NP")}
                    </p>
                  </div>
                  <p className="text-sm font-black text-zinc-900">
                    {currency.format(transaction.amountPaisa / 100)}
                  </p>
                </article>
              ))
            )}
          </div>
        </section>
      </main>

      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-30 flex justify-center px-4 md:hidden">
        <div className="pointer-events-auto w-full max-w-md">
          <button
            type="button"
            onClick={() => {
              void onContinue();
            }}
            disabled={!totalPaisa || isSaving}
            className="min-h-14 w-full rounded-2xl bg-gradient-to-r from-emerald-800 to-emerald-700 px-5 text-base font-black uppercase tracking-[0.1em] text-white shadow-[0_24px_48px_-28px_rgba(7,33,18,0.7)] disabled:cursor-not-allowed disabled:opacity-55"
          >
            {step === "sale" && "Checkout"}
            {step === "customer" && "Continue to Payment"}
            {step === "payment" && "Complete Cash Sale"}
          </button>
        </div>
      </div>

      <MobileBottomNav activeTab="sale" />
    </>
  );
}