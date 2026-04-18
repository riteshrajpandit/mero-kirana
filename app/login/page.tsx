import { redirect } from "next/navigation";

import AuthPanel from "@/app/login/auth-panel";
import { tryGetSessionFromRequestCookies } from "@/server/auth/session";

export default async function LoginPage() {
  const session = await tryGetSessionFromRequestCookies();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 items-center px-4 py-6 sm:px-6">
      <AuthPanel />
    </main>
  );
}