"use client";

import { useRouter } from "next/navigation";

import { clearCsrfToken, fetchWithCsrf } from "@/lib/client/csrf-token";
import { clearAllOfflineData } from "@/lib/offline/session";

export function LogoutButton() {
  const router = useRouter();

  const onLogout = async () => {
    try {
      await clearAllOfflineData();
    } catch (error) {
      console.error("Failed to clear offline data during logout", error);
    }

    await fetchWithCsrf("/api/auth/logout", {
      method: "POST",
    });

    clearCsrfToken();

    router.replace("/login");
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onLogout}
      className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-zinc-700"
    >
      Logout
    </button>
  );
}