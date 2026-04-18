import type { Prisma } from "@prisma/client";

import prisma from "@/lib/db/prisma";

export type CustomerCreateRecord = {
  id: string;
  name: string;
  phone: string | null;
  creditBalancePaisa: number;
  version: number;
  updatedAt: Date;
};

export async function listCustomersByShop(shopId: string) {
  return prisma.customer.findMany({
    where: { shopId },
    orderBy: { updatedAt: "desc" },
    take: 500,
  });
}

export async function findCustomerByIdForShop(shopId: string, id: string) {
  return prisma.customer.findUnique({
    where: {
      id_shopId: {
        id,
        shopId,
      },
    },
  });
}

export async function createCustomerForShop(
  shopId: string,
  input: CustomerCreateRecord,
) {
  return prisma.customer.create({
    data: {
      id: input.id,
      shopId,
      name: input.name,
      phone: input.phone,
      creditBalancePaisa: input.creditBalancePaisa,
      version: input.version,
      updatedAt: input.updatedAt,
    },
  });
}

export async function updateCustomerForShop(
  shopId: string,
  id: string,
  input: Prisma.CustomerUpdateInput,
) {
  return prisma.customer.update({
    where: {
      id_shopId: {
        id,
        shopId,
      },
    },
    data: input,
  });
}