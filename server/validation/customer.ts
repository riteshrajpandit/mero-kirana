import { z } from "zod";

export const createCustomerSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(120),
    phone: z.string().trim().min(5).max(20).optional().nullable(),
    creditBalancePaisa: z.number().int().min(0).optional(),
    updatedAt: z.string().datetime().optional(),
    version: z.number().int().min(1).optional(),
  })
  .strict();

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>;