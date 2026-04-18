import { redirect } from "next/navigation";

import CustomersClient from "@/app/customers/customers-client";
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

export default async function CustomersPage() {
  const session = await getSessionOrRedirect();
  return <CustomersClient shopId={session.shopId} />;
}