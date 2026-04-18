import { redirect } from "next/navigation";

import TransactionsClient from "@/app/transactions/transactions-client";
import { AuthError } from "@/server/auth/errors";
import { getShopContext } from "@/server/auth/shop-context";

async function getSessionOrRedirect() {
  try {
    return await getShopContext();
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.statusCode === 402) {
        redirect("/login/trial-expired");
      }

      redirect("/login");
    }

    throw error;
  }
}

export default async function TransactionsPage() {
  const session = await getSessionOrRedirect();
  return <TransactionsClient shopId={session.shopId} />;
}