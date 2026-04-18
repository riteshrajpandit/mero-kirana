import type { Customer } from "@prisma/client";

import {
  createCustomerForShop,
  findCustomerByIdForShop,
  listCustomersByShop,
  updateCustomerForShop,
} from "@/server/repositories/customer-repository";
import type { CreateCustomerInput } from "@/server/validation/customer";

export type CustomerMergeStatus = "created" | "updated" | "ignored_stale";

function parseIncomingDate(input?: string) {
  return input ? new Date(input) : new Date();
}

export async function getCustomersForShop(shopId: string) {
  return listCustomersByShop(shopId);
}

export async function mergeCustomerForShop(
  shopId: string,
  input: CreateCustomerInput,
): Promise<{ status: CustomerMergeStatus; record: Customer }> {
  const incomingUpdatedAt = parseIncomingDate(input.updatedAt);
  const incomingId = input.id ?? crypto.randomUUID();

  const existing = await findCustomerByIdForShop(shopId, incomingId);

  if (!existing) {
    const created = await createCustomerForShop(shopId, {
      id: incomingId,
      name: input.name,
      phone: input.phone ?? null,
      creditBalancePaisa: input.creditBalancePaisa ?? 0,
      version: input.version ?? 1,
      updatedAt: incomingUpdatedAt,
    });

    return { status: "created", record: created };
  }

  const serverNow = new Date();
  const timeDriftToleranceMs = 5 * 60 * 1000;

  if (Math.abs(incomingUpdatedAt.getTime() - serverNow.getTime()) > timeDriftToleranceMs) {
    console.warn("Customer sync rejected due to excessive time drift", {
      shopId,
      id: incomingId,
      incomingUpdatedAt,
      serverNow,
    });

    return { status: "ignored_stale", record: existing };
  }

  if (incomingUpdatedAt <= existing.updatedAt) {
    console.warn("Ignored stale customer write", {
      shopId,
      id: incomingId,
      incomingUpdatedAt,
      currentUpdatedAt: existing.updatedAt,
    });

    return { status: "ignored_stale", record: existing };
  }

  const updated = await updateCustomerForShop(shopId, incomingId, {
    name: input.name,
    phone: input.phone ?? null,
    creditBalancePaisa: input.creditBalancePaisa ?? existing.creditBalancePaisa,
    version: (input.version ?? existing.version) + 1,
    updatedAt: incomingUpdatedAt,
  });

  return { status: "updated", record: updated };
}