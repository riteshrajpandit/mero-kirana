"use client";

import { useMemo, useRef, useState } from "react";

import { useLiveQuery } from "dexie-react-hooks";

import {
  ActionButton,
  MetricCard,
  SectionHeader,
  SurfaceCard,
  SyncPill,
} from "@/app/dashboard/components/dashboard-primitives";
import { MobileBottomNav } from "@/app/components/mobile-bottom-nav";
import { db } from "@/lib/offline/db";
import {
  createLocalCustomer,
  createLocalTransaction,
} from "@/lib/offline/mutations";
import { useSync } from "@/lib/sync/useSync";
import type { TransactionType } from "@/types/shared";

const currency = new Intl.NumberFormat("en-NP", {
  style: "currency",
  currency: "NPR",
  maximumFractionDigits: 0,
});

function toPaisa(rupees: string) {
  const asNumber = Number(rupees);
  if (!Number.isFinite(asNumber) || asNumber <= 0) {
    return 0;
  }
  return Math.round(asNumber * 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-NP", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type DashboardClientProps = {
  shopId: string;
  userName: string;
};

export default function DashboardClient({
  shopId,
  userName,
}: DashboardClientProps) {
  const { isOnline, isSyncing, lastSyncedAt, lastError, syncNow } = useSync(shopId);

  const customerNameInputRef = useRef<HTMLInputElement>(null);
  const txnAmountInputRef = useRef<HTMLInputElement>(null);

  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [txnAmount, setTxnAmount] = useState("");
  const [txnType, setTxnType] = useState<TransactionType>("CASH");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");

  const customers = useLiveQuery(async () => {
    const rows = await db.customers.where("shopId").equals(shopId).toArray();
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [shopId]);

  const transactions = useLiveQuery(async () => {
    const rows = await db.transactions.where("shopId").equals(shopId).toArray();
    return rows.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }, [shopId]);

  const totalKhataPaisa = useMemo(() => {
    if (!customers) {
      return 0;
    }
    return customers.reduce((sum, customer) => sum + customer.creditBalancePaisa, 0);
  }, [customers]);

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

  const pendingSyncCount = useMemo(() => {
    const pendingCustomers = (customers ?? []).filter((customer) => !customer.isSynced).length;
    const pendingTransactions = (transactions ?? []).filter(
      (transaction) => !transaction.isSynced,
    ).length;
    return pendingCustomers + pendingTransactions;
  }, [customers, transactions]);

  const followUps = useMemo(() => {
    return (customers ?? [])
      .filter((customer) => customer.creditBalancePaisa > 0)
      .sort((a, b) => b.creditBalancePaisa - a.creditBalancePaisa)
      .slice(0, 4);
  }, [customers]);

  const recentTransactions = useMemo(() => {
    return (transactions ?? []).slice(0, 8);
  }, [transactions]);

  const focusTxnAmount = () => {
    requestAnimationFrame(() => {
      txnAmountInputRef.current?.focus();
    });
  };

  const prepareTransaction = (type: TransactionType, resetCustomer = false) => {
    setTxnType(type);

    if (resetCustomer) {
      setSelectedCustomerId("");
    }

    focusTxnAmount();
  };

  const addCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = customerName.trim();

    if (!trimmedName) {
      return;
    }

    await createLocalCustomer({
      shopId,
      name: trimmedName,
      phone: customerPhone,
    });

    setCustomerName("");
    setCustomerPhone("");
    requestAnimationFrame(() => {
      customerNameInputRef.current?.focus();
    });
  };

  const addTransaction = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountPaisa = toPaisa(txnAmount);

    if (!amountPaisa) {
      return;
    }

    await createLocalTransaction({
      shopId,
      amountPaisa,
      type: txnType,
      customerId: selectedCustomerId || undefined,
    });

    setTxnAmount("");
    focusTxnAmount();
  };

  return (
    <>
      <main className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 pb-28 sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(circle_at_top_right,rgba(21,128,61,0.18),transparent_62%),radial-gradient(circle_at_top_left,rgba(249,115,22,0.16),transparent_55%)]" />

        <SurfaceCard className="relative overflow-hidden border-emerald-900/15 bg-gradient-to-br from-emerald-900 via-emerald-800 to-orange-600 text-white">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-16 -left-8 h-48 w-48 rounded-full bg-orange-200/20 blur-2xl" />
          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-white/70">Mero Kirana</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Store Home Dashboard
            </h1>
            <p className="mt-2 max-w-lg text-sm text-white/80 sm:text-base">
              Daily operations, khata tracking, and sync health in one place for faster
              counter work.
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white/85">Signed in as {userName}</p>
              <div className="flex items-center gap-3">
                <SyncPill
                  isOnline={isOnline}
                  isSyncing={isSyncing}
                  pendingItems={pendingSyncCount}
                />
                <button
                  type="button"
                  className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/35 transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
                  onClick={() => {
                    void syncNow();
                  }}
                  disabled={!isOnline || isSyncing}
                >
                  {isSyncing ? "Syncing..." : "Sync Now"}
                </button>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <section>
          <SectionHeader title="Today's Overview" subtitle="Live figures from your local store data" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Today's Sales"
              value={currency.format(todayStats.totalSalesPaisa / 100)}
              hint="Cash + credit"
              tone="brand"
              className="sm:col-span-2"
            />
            <MetricCard
              label="Cash Received"
              value={currency.format(todayStats.cashReceivedPaisa / 100)}
              hint="Cash + payments"
            />
            <MetricCard
              label="Credit Given"
              value={currency.format(todayStats.creditGivenPaisa / 100)}
              hint="Today's khata"
              tone="warning"
            />
            <MetricCard
              label="Total Khata"
              value={currency.format(totalKhataPaisa / 100)}
              hint="Across all customers"
            />
            <MetricCard
              label="Last Sync"
              value={lastSyncedAt ? formatDate(lastSyncedAt) : "Not yet"}
              hint={isOnline ? "Device online" : "Offline mode active"}
              className="sm:col-span-2"
            />
          </div>
          {lastError ? (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              Sync error: {lastError}
            </p>
          ) : null}
        </section>

        <section>
          <SectionHeader
            title="Quick Actions"
            subtitle="Shortcuts tuned for fast counter operations"
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-3">
              <ActionButton
                label="New Sale"
                caption="Switch to cash mode and jump to amount"
                variant="primary"
                onClick={() => prepareTransaction("CASH", true)}
              />
            </div>
            <ActionButton
              label="Add Credit"
              caption="Record a khata sale"
              variant="secondary"
              onClick={() => prepareTransaction("CREDIT")}
            />
            <ActionButton
              label="Receive Payment"
              caption="Set transaction type to payment"
              variant="ghost"
              onClick={() => prepareTransaction("PAYMENT")}
            />
            <ActionButton
              label="Add Customer"
              caption="Jump to customer form"
              variant="ghost"
              onClick={() => {
                requestAnimationFrame(() => {
                  customerNameInputRef.current?.focus();
                });
              }}
            />
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <SurfaceCard>
            <SectionHeader
              title="Add Customer"
              subtitle="Saved instantly on device and synced in background"
            />
            <form onSubmit={addCustomer} className="space-y-3">
              <input
                ref={customerNameInputRef}
                className="min-h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Customer name"
                required
              />
              <input
                className="min-h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
                value={customerPhone}
                onChange={(event) => setCustomerPhone(event.target.value)}
                placeholder="Phone number (optional)"
              />
              <button
                type="submit"
                className="min-h-12 w-full rounded-xl bg-zinc-900 px-4 text-base font-bold text-white transition hover:bg-zinc-700"
              >
                Save Customer
              </button>
            </form>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeader
              title="Quick Sale / Khata"
              subtitle="Use fixed chips or custom amount"
            />
            <form onSubmit={addTransaction} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200, 500, 1000, 1500].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    className="min-h-11 rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                    onClick={() => {
                      setTxnAmount(String(amount));
                      focusTxnAmount();
                    }}
                  >
                    Rs {amount}
                  </button>
                ))}
              </div>

              <input
                ref={txnAmountInputRef}
                className="min-h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
                value={txnAmount}
                onChange={(event) => setTxnAmount(event.target.value)}
                placeholder="Amount in rupees"
                inputMode="numeric"
                required
              />

              <select
                className="min-h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
                value={selectedCustomerId}
                onChange={(event) => setSelectedCustomerId(event.target.value)}
              >
                <option value="">No customer (cash counter)</option>
                {(customers ?? []).map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-3 gap-2">
                {([
                  ["CASH", "Cash"],
                  ["CREDIT", "Khata"],
                  ["PAYMENT", "Paid"],
                ] as const).map(([type, label]) => (
                  <button
                    key={type}
                    type="button"
                    className={`min-h-11 rounded-lg px-3 text-sm font-bold transition ${
                      txnType === type
                        ? "bg-orange-600 text-white"
                        : "border border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
                    }`}
                    onClick={() => setTxnType(type)}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="min-h-12 w-full rounded-xl bg-orange-600 px-4 text-base font-bold text-white transition hover:bg-orange-700"
              >
                Save Transaction
              </button>
            </form>
          </SurfaceCard>
        </section>

        <section className="grid gap-5 xl:grid-cols-2">
          <SurfaceCard>
            <SectionHeader
              title="Customer Snapshot"
              subtitle="Most recently updated customers"
            />
            <div className="space-y-2">
              {(customers ?? []).length === 0 ? (
                <p className="rounded-lg bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
                  No customers yet.
                </p>
              ) : (
                (customers ?? []).slice(0, 8).map((customer) => (
                  <div
                    key={customer.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-3"
                  >
                    <div>
                      <p className="font-bold text-zinc-900">{customer.name}</p>
                      <p className="text-xs text-zinc-500">
                        {customer.phone || "No phone"} • {customer.isSynced ? "Synced" : "Pending"}
                      </p>
                    </div>
                    <p className="font-bold text-zinc-900">
                      {currency.format(customer.creditBalancePaisa / 100)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <SectionHeader title="Recent Transactions" subtitle="Latest cash, khata, and payments" />
            <div className="space-y-2">
              {recentTransactions.length === 0 ? (
                <p className="rounded-lg bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
                  No transactions yet.
                </p>
              ) : (
                recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-3"
                  >
                    <div>
                      <p className="font-bold text-zinc-900">{transaction.type}</p>
                      <p className="text-xs text-zinc-500">
                        {formatDate(transaction.occurredAt)} • {transaction.isSynced ? "Synced" : "Pending"}
                      </p>
                    </div>
                    <p className="font-bold text-zinc-900">
                      {currency.format(transaction.amountPaisa / 100)}
                    </p>
                  </div>
                ))
              )}
            </div>
          </SurfaceCard>
        </section>

        <SurfaceCard>
          <SectionHeader
            title="Khata Follow-up"
            subtitle="Customers with highest outstanding balance"
          />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {followUps.length === 0 ? (
              <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-4 text-sm text-zinc-600 sm:col-span-2 lg:col-span-4">
                No outstanding khata right now.
              </p>
            ) : (
              followUps.map((customer) => (
                <article
                  key={customer.id}
                  className="rounded-2xl border border-orange-200/70 bg-orange-50 px-4 py-3"
                >
                  <p className="font-bold text-orange-950">{customer.name}</p>
                  <p className="mt-1 text-sm font-semibold text-orange-700">
                    Balance: {currency.format(customer.creditBalancePaisa / 100)}
                  </p>
                  <p className="mt-1 text-xs text-orange-700/80">
                    {customer.phone ? `Call ${customer.phone}` : "No phone on file"}
                  </p>
                </article>
              ))
            )}
          </div>
        </SurfaceCard>
      </main>

      <MobileBottomNav activeTab="home" />
    </>
  );
}