import { z } from 'zod';

export const createAlertSubscriptionSchema = z.object({
  type: z.enum(['IDEAL_CONDITIONS', 'REGULATION_REMINDER', 'WATER_LEVEL_ABNORMAL', 'CUSTOM_SPOT_ACTIVITY']),
  spotId: z.string().optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().default(true),
});

export const updateAlertSubscriptionSchema = createAlertSubscriptionSchema.partial();

export type CreateAlertSubscriptionInput = z.infer<typeof createAlertSubscriptionSchema>;
export type UpdateAlertSubscriptionInput = z.infer<typeof updateAlertSubscriptionSchema>;
