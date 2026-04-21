import Link from "next/link";
import type { ReactNode } from "react";

type MaybeClassName = string | false | null | undefined;

function cx(...parts: MaybeClassName[]) {
  return parts.filter(Boolean).join(" ");
}

type SurfaceCardProps = {
  children: ReactNode;
  className?: string;
};

export function SurfaceCard({ children, className }: SurfaceCardProps) {
  return (
    <section
      className={cx(
        "rounded-[1.75rem] border border-emerald-950/10 bg-white/90 p-4 shadow-[0_18px_55px_-28px_rgba(7,33,18,0.45)] backdrop-blur sm:p-5",
        className,
      )}
    >
      {children}
    </section>
  );
}

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-black tracking-tight text-emerald-950 sm:text-xl">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-emerald-900/70">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  hint?: string;
  tone?: "neutral" | "brand" | "warning";
  className?: string;
};

export function MetricCard({
  label,
  value,
  hint,
  tone = "neutral",
  className,
}: MetricCardProps) {
  return (
    <article
      className={cx(
        "rounded-3xl border p-4 shadow-sm",
        tone === "brand" &&
          "border-emerald-700/25 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-700 text-white",
        tone === "warning" && "border-orange-300/40 bg-orange-50 text-orange-950",
        tone === "neutral" && "border-zinc-200 bg-white text-zinc-950",
        className,
      )}
    >
      <p
        className={cx(
          "text-sm font-semibold",
          tone === "brand" ? "text-white/80" : "text-zinc-600",
          tone === "warning" && "text-orange-700",
        )}
      >
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">{value}</p>
      {hint ? (
        <p
          className={cx(
            "mt-1 text-xs font-medium",
            tone === "brand" ? "text-white/75" : "text-zinc-500",
            tone === "warning" && "text-orange-700",
          )}
        >
          {hint}
        </p>
      ) : null}
    </article>
  );
}

type ActionButtonProps = {
  label: string;
  caption: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
};

export function ActionButton({
  label,
  caption,
  onClick,
  variant = "secondary",
}: ActionButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "w-full rounded-2xl border px-4 py-4 text-left transition active:scale-[0.98]",
        variant === "primary" &&
          "border-orange-400/40 bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-[0_18px_40px_-24px_rgba(234,88,12,0.7)]",
        variant === "secondary" &&
          "border-emerald-900/15 bg-emerald-50 text-emerald-950 hover:bg-emerald-100",
        variant === "ghost" && "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50",
      )}
    >
      <p className="text-base font-black tracking-tight">{label}</p>
      <p
        className={cx(
          "mt-1 text-xs font-medium",
          variant === "primary" ? "text-white/85" : "text-zinc-600",
        )}
      >
        {caption}
      </p>
    </button>
  );
}

type SyncPillProps = {
  isOnline: boolean;
  isSyncing: boolean;
  pendingItems: number;
};

export function SyncPill({ isOnline, isSyncing, pendingItems }: SyncPillProps) {
  const label = isSyncing
    ? "Syncing now"
    : pendingItems > 0
      ? `${pendingItems} pending`
      : "All data synced";

  return (
    <div
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-[0.13em]",
        !isOnline && "border-red-200 bg-red-50 text-red-700",
        isOnline && pendingItems > 0 && "border-orange-200 bg-orange-50 text-orange-700",
        isOnline && pendingItems === 0 && "border-emerald-200 bg-emerald-50 text-emerald-700",
      )}
    >
      <span
        className={cx(
          "h-2.5 w-2.5 rounded-full",
          !isOnline && "bg-red-500",
          isSyncing && "animate-pulse bg-orange-500",
          isOnline && !isSyncing && pendingItems > 0 && "bg-orange-500",
          isOnline && !isSyncing && pendingItems === 0 && "bg-emerald-500",
        )}
      />
      {isOnline ? label : "Offline mode"}
    </div>
  );
}

type BottomNavProps = {
  onSyncNow: () => void;
  isSyncing: boolean;
};

export function BottomNav({ onSyncNow, isSyncing }: BottomNavProps) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-[#fff8ef]/95 px-4 pb-5 pt-3 backdrop-blur sm:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 items-center gap-2 rounded-3xl border border-zinc-200 bg-white p-2 shadow-[0_20px_45px_-25px_rgba(9,9,11,0.45)]">
        <Link
          href="/dashboard"
          className="rounded-2xl bg-orange-500 px-2 py-2 text-center text-xs font-bold text-white"
        >
          Home
        </Link>
        <Link
          href="/customers"
          className="rounded-2xl px-2 py-2 text-center text-xs font-bold text-zinc-700"
        >
          Customers
        </Link>
        <Link
          href="/transactions"
          className="rounded-2xl px-2 py-2 text-center text-xs font-bold text-zinc-700"
        >
          Sales
        </Link>
        <button
          type="button"
          onClick={onSyncNow}
          className="rounded-2xl px-2 py-2 text-center text-xs font-bold text-emerald-800 disabled:opacity-50"
          disabled={isSyncing}
        >
          {isSyncing ? "Sync..." : "Sync"}
        </button>
      </div>
    </nav>
  );
}
