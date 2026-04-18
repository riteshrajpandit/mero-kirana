"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { getErrorMessage } from "@/lib/client/error-message";
import { fetchWithCsrf } from "@/lib/client/csrf-token";
import { clearOfflineDataForOtherShops } from "@/lib/offline/session";

type LoginFormProps = {
  onSwitchToRegister: () => void;
};

export default function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const router = useRouter();
  const [shopSlug, setShopSlug] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const normalizedShopSlug = shopSlug.trim().toLowerCase();
      const normalizedEmail = email.trim().toLowerCase();

      if (!normalizedShopSlug || !normalizedEmail || !password) {
        setError("Please fill in all required fields.");
        return;
      }

      const response = await fetchWithCsrf("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shopSlug: normalizedShopSlug,
          email: normalizedEmail,
          password,
        }),
      });

      const payload = (await response.json()) as {
        error?: unknown;
        data?: {
          shop?: {
            id?: string;
          };
        };
      };

      if (!response.ok) {
        setError(getErrorMessage(payload, "Unable to sign in"));
        return;
      }

      const shopId = payload.data?.shop?.id;

      if (shopId) {
        await clearOfflineDataForOtherShops(shopId);
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to sign in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form
      className="w-full rounded-2xl border border-orange-200 bg-white p-5 shadow-sm sm:p-6"
      onSubmit={onSubmit}
    >
      <h1 className="text-2xl font-bold text-zinc-900">Shopkeeper Sign In</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Sign in with your shop slug and owner account.
      </p>

      <div className="mt-4 grid gap-3">
        <input
          className="min-h-12 rounded-xl border border-zinc-300 px-4 text-base text-zinc-900 outline-none ring-orange-400 transition focus:ring-2"
          value={shopSlug}
          onChange={(event) => setShopSlug(event.target.value)}
          placeholder="Shop slug (example: first-shop)"
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
        {isLoading ? "Signing in..." : "Sign In"}
      </button>

      <button
        type="button"
        onClick={onSwitchToRegister}
        className="mt-3 min-h-11 w-full rounded-xl border border-zinc-300 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
      >
        New shopkeeper? Register here
      </button>
    </form>
  );
}