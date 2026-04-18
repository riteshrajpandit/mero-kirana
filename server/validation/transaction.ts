import { z } from "zod";

export const createTransactionSchema = z
  .object({
    id: z.string().uuid().optional(),
    customerId: z.string().uuid().optional().nullable(),
    type: z.enum(["CASH", "CREDIT", "PAYMENT"]),
    amountPaisa: z.number().int().positive(),
    note: z.string().trim().max(240).optional().nullable(),
    occurredAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
    version: z.number().int().min(1).optional(),
  })
  .strict();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;