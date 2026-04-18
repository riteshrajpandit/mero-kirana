import Link from "next/link";

type SuccessPageProps = {
  searchParams: Promise<{
    shopName?: string;
    trialEndsAt?: string;
  }>;
};

function formatDate(input: string | undefined) {
  if (!input) {
    return "in 15 days";
  }

  const value = new Date(input);

  if (Number.isNaN(value.getTime())) {
    return "in 15 days";
  }

  return value.toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function RegisterSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams;
  const shopName = params.shopName?.trim() || "Your shop";
  const trialEndLabel = formatDate(params.trialEndsAt);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-6 sm:px-6">
      <section className="w-full rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
          Registration Complete
        </p>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">
          {shopName} is ready
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Your 15-day trial is active and will end on <strong>{trialEndLabel}</strong>.
        </p>

        <div className="mt-5 grid gap-3">
          <Link
            href="/dashboard"
            className="min-h-12 rounded-xl bg-orange-600 px-4 py-3 text-center text-base font-semibold text-white transition hover:bg-orange-700"
          >
            Continue to Dashboard
          </Link>
          <Link
            href="/customers"
            className="min-h-11 rounded-xl border border-zinc-300 px-4 py-3 text-center text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Add First Customer
          </Link>
        </div>
      </section>
    </main>
  );
}
