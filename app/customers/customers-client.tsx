"use client";

import { useMemo, useState } from "react";

import { useLiveQuery } from "dexie-react-hooks";

import { MobileBottomNav } from "@/app/components/mobile-bottom-nav";
import { db } from "@/lib/offline/db";
import {
  createLocalCustomer,
  createLocalTransaction,
} from "@/lib/offline/mutations";

const currency = new Intl.NumberFormat("en-NP", {
  style: "currency",
  currency: "NPR",
  maximumFractionDigits: 0,
});

function toPaisa(value: string) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.round(parsed * 100);
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-NP", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

type CustomersClientProps = {
  shopId: string;
};

export default function CustomersClient({ shopId }: CustomersClientProps) {
  const [query, setQuery] = useState("");
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [amount, setAmount] = useState("");
  const [actionType, setActionType] = useState<"CREDIT" | "PAYMENT">("CREDIT");

  const customers = useLiveQuery(async () => {
    const rows = await db.customers.where("shopId").equals(shopId).toArray();
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [shopId]);

  const transactions = useLiveQuery(async () => {
    const rows = await db.transactions.where("shopId").equals(shopId).toArray();
    return rows.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
  }, [shopId]);

  const filteredCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      return customers ?? [];
    }

    return (customers ?? []).filter((customer) => {
      const byName = customer.name.toLowerCase().includes(q);
      const byPhone = customer.phone?.toLowerCase().includes(q) ?? false;
      return byName || byPhone;
    });
  }, [customers, query]);

  const selectedCustomer = useMemo(() => {
    if ((customers ?? []).length === 0) {
      return null;
    }

    if (selectedCustomerId) {
      return (customers ?? []).find((customer) => customer.id === selectedCustomerId) ?? null;
    }

    return filteredCustomers[0] ?? customers?.[0] ?? null;
  }, [customers, filteredCustomers, selectedCustomerId]);

  const customerHistory = useMemo(() => {
    if (!selectedCustomer) {
      return [];
    }

    return (transactions ?? [])
      .filter((transaction) => transaction.customerId === selectedCustomer.id)
      .slice(0, 12);
  }, [selectedCustomer, transactions]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = name.trim();

    if (!trimmed) {
      return;
    }

    await createLocalCustomer({
      shopId,
      name: trimmed,
      phone,
    });

    setName("");
    setPhone("");
    setIsAddCustomerOpen(false);
  };

  const onRecordKhata = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedCustomer) {
      return;
    }

    const amountPaisa = toPaisa(amount);

    if (!amountPaisa) {
      return;
    }

    await createLocalTransaction({
      shopId,
      customerId: selectedCustomer.id,
      amountPaisa,
      type: actionType,
    });

    setAmount("");
  };

  return (
    <>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-6 pb-32 sm:px-6 lg:px-8">
        <section className="rounded-[1.8rem] border border-emerald-900/15 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 p-5 text-white shadow-[0_26px_56px_-36px_rgba(6,95,70,0.65)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-100/80">
                Khata Ledger
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Customer Accounts</h1>
            </div>
            <button
              type="button"
              onClick={() => setIsAddCustomerOpen((open) => !open)}
              className="rounded-xl bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.1em] ring-1 ring-white/30"
            >
              {isAddCustomerOpen ? "Close" : "New"}
            </button>
          </div>

          {isAddCustomerOpen ? (
            <form onSubmit={onSubmit} className="mt-4 grid gap-2 sm:grid-cols-3">
              <input
                className="min-h-11 rounded-xl border border-white/25 bg-white/10 px-3 text-sm text-white placeholder:text-white/65 outline-none ring-orange-300 transition focus:ring-2"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Customer name"
                required
              />
              <input
                className="min-h-11 rounded-xl border border-white/25 bg-white/10 px-3 text-sm text-white placeholder:text-white/65 outline-none ring-orange-300 transition focus:ring-2"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="Phone (optional)"
              />
              <button
                type="submit"
                className="min-h-11 rounded-xl bg-orange-500 px-3 text-sm font-black uppercase tracking-[0.08em] text-white transition hover:bg-orange-400"
              >
                Save Customer
              </button>
            </form>
          ) : null}
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="rounded-[1.4rem] border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="relative">
              <input
                className="min-h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none ring-emerald-300 transition focus:ring-2"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search customer by name or phone"
              />
            </div>

            <div className="mt-3 space-y-2">
              {filteredCustomers.length === 0 ? (
                <p className="rounded-xl bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
                  No customers found.
                </p>
              ) : (
                filteredCustomers.map((customer) => {
                  const isActive = selectedCustomer?.id === customer.id;
                  const hasDue = customer.creditBalancePaisa > 0;

                  return (
                    <button
                      key={customer.id}
                      type="button"
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                        isActive
                          ? "border-orange-300 bg-orange-50"
                          : "border-zinc-200 bg-white hover:bg-zinc-50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-black text-zinc-900">{customer.name}</p>
                          <p className="text-xs text-zinc-500">{customer.phone || "No phone"}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-black ${hasDue ? "text-red-600" : "text-emerald-700"}`}>
                            {hasDue
                              ? currency.format(customer.creditBalancePaisa / 100)
                              : "Cleared"}
                          </p>
                          <p className="text-[11px] font-bold uppercase tracking-[0.09em] text-zinc-500">
                            {customer.isSynced ? "Synced" : "Pending"}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
            {!selectedCustomer ? (
              <p className="rounded-xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-600">
                Select a customer to view khata details.
              </p>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-zinc-900">
                      {selectedCustomer.name}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-600">
                      {selectedCustomer.phone || "No phone number"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.1em] text-orange-700">
                      Total Due
                    </p>
                    <p className="mt-1 text-2xl font-black tracking-tight text-orange-900">
                      {currency.format(selectedCustomer.creditBalancePaisa / 100)}
                    </p>
                  </div>
                </div>

                <form onSubmit={onRecordKhata} className="mt-4 space-y-3 rounded-xl bg-zinc-50 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setActionType("CREDIT")}
                      className={`min-h-11 rounded-lg px-3 text-sm font-black uppercase tracking-[0.08em] transition ${
                        actionType === "CREDIT"
                          ? "bg-orange-500 text-white"
                          : "border border-zinc-300 bg-white text-zinc-700"
                      }`}
                    >
                      Add Credit
                    </button>
                    <button
                      type="button"
                      onClick={() => setActionType("PAYMENT")}
                      className={`min-h-11 rounded-lg px-3 text-sm font-black uppercase tracking-[0.08em] transition ${
                        actionType === "PAYMENT"
                          ? "bg-emerald-700 text-white"
                          : "border border-zinc-300 bg-white text-zinc-700"
                      }`}
                    >
                      Receive
                    </button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <input
                      className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none ring-orange-300 transition focus:ring-2"
                      value={amount}
                      onChange={(event) => setAmount(event.target.value)}
                      placeholder="Amount in rupees"
                      inputMode="numeric"
                      required
                    />
                    <button
                      type="submit"
                      className="min-h-11 rounded-lg bg-zinc-900 px-5 text-sm font-black uppercase tracking-[0.08em] text-white"
                    >
                      Save
                    </button>
                  </div>
                </form>

                <div className="mt-5">
                  <h3 className="text-sm font-black uppercase tracking-[0.12em] text-zinc-600">
                    Transaction History
                  </h3>
                  <div className="mt-2 space-y-2">
                    {customerHistory.length === 0 ? (
                      <p className="rounded-xl bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
                        No khata transactions yet.
                      </p>
                    ) : (
                      customerHistory.map((transaction) => {
                        const isPayment = transaction.type === "PAYMENT";

                        return (
                          <article
                            key={transaction.id}
                            className="flex items-center justify-between rounded-xl border border-zinc-200 px-3 py-3"
                          >
                            <div>
                              <p className="text-sm font-black text-zinc-900">{transaction.type}</p>
                              <p className="text-xs text-zinc-500">
                                {formatDate(transaction.occurredAt)}
                              </p>
                            </div>
                            <p
                              className={`text-sm font-black ${
                                isPayment ? "text-emerald-700" : "text-red-600"
                              }`}
                            >
                              {isPayment ? "-" : "+"}
                              {currency.format(transaction.amountPaisa / 100)}
                            </p>
                          </article>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <MobileBottomNav activeTab="khata" />
    </>
  );
}