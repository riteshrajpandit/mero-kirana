"use client";

import { useState } from "react";

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/lib/offline/db";
import { createLocalTransaction } from "@/lib/offline/mutations";
import type { TransactionType } from "@/types/shared";

const currency = new Intl.NumberFormat("en-NP", {
  style: "currency",
  currency: "NPR",
  maximumFractionDigits: 0,
});

function toPaisa(rupees: string) {
  const value = Number(rupees);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.round(value * 100);
}

type TransactionsClientProps = {
  shopId: string;
};

export default function TransactionsClient({ shopId }: TransactionsClientProps) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("CASH");
  const [customerId, setCustomerId] = useState("");

  const customers = useLiveQuery(async () => {
    return db.customers.where("shopId").equals(shopId).toArray();
  }, [shopId]);

  const transactions = useLiveQuery(async () => {
    const rows = await db.transactions.where("shopId").equals(shopId).toArray();
    return rows.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }, [shopId]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountPaisa = toPaisa(amount);

    if (!amountPaisa) {
      return;
    }

    await createLocalTransaction({
      shopId,
      amountPaisa,
      type,
      customerId: customerId || undefined,
    });

    setAmount("");
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <h1 className="text-2xl font-bold text-zinc-900">Transactions</h1>
        <p className="mt-1 text-sm text-zinc-600">Quick record for sale, khata, and payment.</p>

        <form onSubmit={onSubmit} className="mt-4 grid gap-3">
          <input
            className="min-h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="Amount in rupees"
            inputMode="numeric"
            required
          />

          <select
            className="min-h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
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
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`min-h-11 rounded-lg px-3 text-sm font-semibold transition ${
                  value === type
                    ? "bg-orange-600 text-white"
                    : "border border-zinc-300 bg-zinc-50 text-zinc-800 hover:bg-zinc-100"
                }`}
                onClick={() => setType(value)}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="min-h-12 rounded-xl bg-orange-600 px-4 text-base font-semibold text-white transition hover:bg-orange-700"
          >
            Save Transaction
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Recent</h2>
        <div className="mt-3 space-y-2">
          {(transactions ?? []).map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-3"
            >
              <div>
                <p className="font-semibold text-zinc-900">{transaction.type}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(transaction.occurredAt).toLocaleString("en-NP")}
                </p>
              </div>
              <p className="font-semibold text-zinc-900">
                {currency.format(transaction.amountPaisa / 100)}
              </p>
            </div>
          ))}

          {(transactions ?? []).length === 0 ? (
            <p className="rounded-lg bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
              No transactions added yet.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}