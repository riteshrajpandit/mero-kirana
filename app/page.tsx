import { redirect } from "next/navigation";

import { tryGetSessionFromRequestCookies } from "@/server/auth/session";

export default async function Home() {
  const session = await tryGetSessionFromRequestCookies();
  redirect(session ? "/dashboard" : "/login");
}
