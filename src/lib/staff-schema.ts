import * as z from "zod";

import { loginSchema } from "@/lib/login-schema";
import { STAFF_ROLES } from "@/lib/roles";

export const staffAccountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, { error: "Enter a name.", abort: true })
    .max(80, { error: "Name must be 80 characters or less.", abort: true }),
  email: loginSchema.shape.email,
  password: z.string().min(8, "Use at least 8 characters."),
  role: z.enum(STAFF_ROLES, { error: "Choose a role." }),
});

export type StaffAccountValues = z.infer<typeof staffAccountSchema>;
