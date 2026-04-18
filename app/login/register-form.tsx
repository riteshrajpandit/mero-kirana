"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { clearOfflineDataForOtherShops } from "@/lib/offline/session";

type RegisterFormProps = {
  onSwitchToLogin: () => void;
};

export default function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const router = useRouter();
  const [shopName, setShopName] = useState("");
  const [shopSlug, setShopSlug] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopName,
          shopSlug,
          ownerName,
          email,
          password,
          confirmPassword,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        data?: {
          shop?: {
            id?: string;
            name?: string;
            trialEndsAt?: string;
          };
        };
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to create account");
        return;
      }

      const shopId = payload.data?.shop?.id;

      if (shopId) {
        await clearOfflineDataForOtherShops(shopId);
      }

      const query = new URLSearchParams();

      if (payload.data?.shop?.name) {
        query.set("shopName", payload.data.shop.name);
      }

      if (payload.data?.shop?.trialEndsAt) {
        query.set("trialEndsAt", payload.data.shop.trialEndsAt);
      }

      router.replace(`/login/success?${query.toString()}`);
      router.refresh();
    } catch {
      setError("Unable to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className="w-full rounded-2xl border border-orange-200 bg-white p-5 shadow-sm sm:p-6"
      onSubmit={onSubmit}
    >
      <h1 className="text-2xl font-bold text-zinc-900">Create Shop Account</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Start your store with a 15-day free trial.
      </p>

      <div className="mt-4 grid gap-3">
        <input
          className="min-h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
          value={shopName}
          onChange={(event) => setShopName(event.target.value)}
          placeholder="Shop name"
          required
        />
        <input
          className="min-h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
          value={shopSlug}
          onChange={(event) => setShopSlug(event.target.value)}
          placeholder="Shop slug (example: hari-kirana)"
          pattern="[a-zA-Z0-9-]+"
          required
        />
        <input
          className="min-h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
          value={ownerName}
          onChange={(event) => setOwnerName(event.target.value)}
          placeholder="Owner name"
          required
        />
        <input
          className="min-h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
        />
        <input
          className="min-h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
        />
        <input
          className="min-h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirm password"
          required
        />
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isLoading}
        className="mt-4 min-h-12 w-full rounded-xl bg-orange-600 px-4 text-base font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoading ? "Creating account..." : "Register & Start Trial"}
      </button>

      <button
        type="button"
        onClick={onSwitchToLogin}
        className="mt-3 min-h-11 w-full rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
      >
        Already have an account? Sign in
      </button>
    </form>
  );
}