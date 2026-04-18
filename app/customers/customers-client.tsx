"use client";

import { useState } from "react";

import { useLiveQuery } from "dexie-react-hooks";

import { db } from "@/lib/offline/db";
import { createLocalCustomer } from "@/lib/offline/mutations";

type CustomersClientProps = {
  shopId: string;
};

export default function CustomersClient({ shopId }: CustomersClientProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const customers = useLiveQuery(async () => {
    const rows = await db.customers.where("shopId").equals(shopId).toArray();
    return rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [shopId]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      return;
    }

    await createLocalCustomer({
      shopId,
      name,
      phone,
    });

    setName("");
    setPhone("");
  };

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-6 sm:px-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <h1 className="text-2xl font-bold text-zinc-900">Customers</h1>
        <p className="mt-1 text-sm text-zinc-600">Add customers instantly, even without internet.</p>

        <form onSubmit={onSubmit} className="mt-4 grid gap-3">
          <input
            className="min-h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Customer name"
            required
          />
          <input
            className="min-h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="Phone number (optional)"
          />
          <button
            type="submit"
            className="min-h-12 rounded-xl bg-zinc-900 px-4 text-base font-semibold text-white transition hover:bg-zinc-700"
          >
            Save Customer
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="text-lg font-semibold text-zinc-900">Recent</h2>
        <div className="mt-3 space-y-2">
          {(customers ?? []).map((customer) => (
            <div
              key={customer.id}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-3"
            >
              <div>
                <p className="font-semibold text-zinc-900">{customer.name}</p>
                <p className="text-xs text-zinc-500">{customer.phone || "No phone"}</p>
              </div>
              <p className="text-xs font-semibold text-zinc-600">
                {customer.isSynced ? "Synced" : "Pending"}
              </p>
            </div>
          ))}

          {(customers ?? []).length === 0 ? (
            <p className="rounded-lg bg-zinc-50 px-3 py-4 text-sm text-zinc-600">
              No customers added yet.
            </p>
          ) : null}
        </div>
      </section>
    </main>
  );
}