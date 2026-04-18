import Link from "next/link";

import { LogoutButton } from "@/app/components/logout-button";
import RenewButton from "@/app/login/trial-expired/renew-button";

export default function TrialExpiredPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-6 sm:px-6">
      <section className="w-full rounded-2xl border border-red-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-700">
          Trial Expired
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">
          Your shop trial has ended
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Renew your subscription to continue using dashboard, customers, and
          transactions.
        </p>

        <div className="mt-5 grid gap-3">
          <RenewButton />

          <a
            href="mailto:support@merokirana.local?subject=Renew%20Mero%20Kirana%20Subscription"
            className="min-h-11 rounded-xl border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Need help? Contact Support
          </a>

          <div className="grid gap-3 sm:grid-cols-2">
            <LogoutButton />
            <Link
              href="/"
              className="min-h-11 rounded-xl border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
