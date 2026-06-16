import { z } from 'zod';
import { emailSchema, uuidSchema } from './common';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth/password-constants';

export const botSettingsSchema = z.object({
  showTips: z.boolean().optional(),
  autoCloseTips: z.boolean().optional(),
  autoCloseDelay: z.number().int().min(1000).max(60_000).optional(),
});

export const preferencesPatchSchema = z
  .object({
    onboardingCompleted: z.boolean().optional(),
    activeWorkspaceId: z.union([uuidSchema, z.null()]).optional(),
    botSettings: botSettingsSchema.optional(),
    keybindingsEnabled: z.boolean().optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: 'At least one preference field is required',
  });

export const setPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(128, 'Password is too long'),
  currentPassword: z.string().max(128).optional(),
});

export const deleteAccountSchema = z.object({
  confirmEmail: emailSchema,
});

export const keybindingOverrideSchema = z.object({
  bindingId: z.string().trim().min(1).max(128),
  keys: z.string().trim().min(1).max(64),
});

export const keybindingsPatchSchema = z.union([
  z.object({
    overrides: z.record(z.string(), z.string().max(64)),
  }),
  z.object({
    merge: z.record(z.string(), z.string().max(64)),
  }),
]);

export const keybindingsDeleteSchema = z.object({
  bindingId: z.string().trim().min(1).max(128),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20).max(256),
  newPassword: z
    .string()
    .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    .max(128, 'Password is too long'),
});

export const resetPasswordTokenQuerySchema = z.object({
  token: z.string().trim().min(20).max(256),
});
