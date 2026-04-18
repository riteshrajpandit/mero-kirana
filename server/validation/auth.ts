import { z } from "zod";
import { PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from "@/lib/constants";

const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const loginSchema = z
  .object({
    shopSlug: z.string().trim().min(2).max(80),
    email: z.string().trim().email().toLowerCase(),
    // Keep login permissive to avoid locking out legacy accounts created before stricter policies.
    password: z.string().min(1).max(PASSWORD_MAX_LENGTH),
  })
  .strict();

export const registerSchema = z
  .object({
    shopName: z.string().trim().min(2).max(120),
    shopSlug: z
      .string()
      .trim()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9-]+$/i, "Only letters, numbers, and hyphens are allowed"),
    ownerName: z.string().trim().min(2).max(120),
    email: z.string().trim().email().toLowerCase(),
    password: passwordSchema,
    confirmPassword: z.string().min(PASSWORD_MIN_LENGTH).max(PASSWORD_MAX_LENGTH),
  })
  .strict()
  .refine((input) => input.password === input.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;