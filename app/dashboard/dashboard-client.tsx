"use client";

import { useMemo, useState } from "react";

import { useLiveQuery } from "dexie-react-hooks";

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
  };

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-2xl border border-orange-200 bg-orange-50/80 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">
              Mero Kirana Dashboard
            </p>
            <h1 className="mt-1 text-2xl font-bold text-orange-950 sm:text-3xl">
              Fast Sales, Even Offline
            </h1>
            <p className="mt-1 text-sm text-zinc-600">Signed in as {userName}</p>
          </div>
          <button
            type="button"
            className="min-h-12 rounded-xl bg-orange-600 px-5 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => {
              void syncNow();
            }}
            disabled={!isOnline || isSyncing}
          >
            {isSyncing ? "Syncing..." : "Sync Now"}
          </button>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-600">Connection</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">
              {isOnline ? "Online" : "Offline"}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-600">Total Khata</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">
              {currency.format(totalKhataPaisa / 100)}
            </p>
          </div>
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <p className="text-sm text-zinc-600">Last Sync</p>
            <p className="mt-1 text-lg font-semibold text-zinc-900">
              {lastSyncedAt ? formatDate(lastSyncedAt) : "Not yet"}
            </p>
          </div>
        </div>
        {lastError ? (
          <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">
            Sync error: {lastError}
          </p>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <form
          onSubmit={addCustomer}
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <h2 className="text-xl font-bold text-zinc-900">Add Customer</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Save instantly to device and sync in background.
          </p>

          <div className="mt-4 space-y-3">
            <input
              className="min-h-12 w-full rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              placeholder="Customer name"
              required
            />
            <input
              className="min-h-12 w-full rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
              value={customerPhone}
              onChange={(event) => setCustomerPhone(event.target.value)}
              placeholder="Phone number (optional)"
            />
            <button
              type="submit"
              className="min-h-12 w-full rounded-xl bg-zinc-900 px-4 text-base font-semibold text-white transition hover:bg-zinc-700"
            >
              Save Customer
            </button>
          </div>
        </form>

        <form
          onSubmit={addTransaction}
          className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <h2 className="text-xl font-bold text-zinc-900">Quick Sale / Khata</h2>
          <p className="mt-1 text-sm text-zinc-600">1 to 2 taps for daily transactions.</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {[50, 100, 200, 500, 1000, 1500].map((amount) => (
              <button
                key={amount}
                type="button"
                className="min-h-11 rounded-lg border border-zinc-300 bg-zinc-50 px-3 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-100"
                onClick={() => setTxnAmount(String(amount))}
              >
                Rs {amount}
              </button>
            ))}
          </div>

          <input
            className="mt-3 min-h-12 w-full rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
            value={txnAmount}
            onChange={(event) => setTxnAmount(event.target.value)}
            placeholder="Amount in rupees"
            inputMode="numeric"
            required
          />

          <select
            className="mt-3 min-h-12 w-full rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
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

          <div className="mt-3 grid grid-cols-3 gap-2">
            {([
              ["CASH", "Cash"],
              ["CREDIT", "Khata"],
              ["PAYMENT", "Paid"],
            ] as const).map(([type, label]) => (
              <button
                key={type}
                type="button"
                className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition ${
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
            className="mt-3 min-h-12 w-full rounded-xl bg-orange-600 px-4 text-base font-semibold text-white transition hover:bg-orange-700"
          >
            Save Transaction
          </button>
        </form>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-xl font-bold text-zinc-900">Customers</h2>
          <div className="mt-3 space-y-2">
            {(customers ?? []).length === 0 ? (
              <p className="rounded-lg bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
                No customers yet.
              </p>
            ) : (
              (customers ?? []).slice(0, 8).map((customer) => (
                <div
                  key={customer.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-3"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">{customer.name}</p>
                    <p className="text-xs text-zinc-500">
                      {customer.phone || "No phone"} • {customer.isSynced ? "Synced" : "Pending"}
                    </p>
                  </div>
                  <p className="font-semibold text-zinc-900">
                    {currency.format(customer.creditBalancePaisa / 100)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-xl font-bold text-zinc-900">Recent Transactions</h2>
          <div className="mt-3 space-y-2">
            {(transactions ?? []).length === 0 ? (
              <p className="rounded-lg bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
                No transactions yet.
              </p>
            ) : (
              (transactions ?? []).slice(0, 8).map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-3"
                >
                  <div>
                    <p className="font-semibold text-zinc-900">{transaction.type}</p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(transaction.occurredAt)} • {transaction.isSynced ? "Synced" : "Pending"}
                    </p>
                  </div>
                  <p className="font-semibold text-zinc-900">
                    {currency.format(transaction.amountPaisa / 100)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </main>
  );
}