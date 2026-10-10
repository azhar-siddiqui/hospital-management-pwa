import * as z from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { error: "Enter your work email.", abort: true })
    .max(254, { error: "Enter a valid email address.", abort: true }),
  password: z.string().min(1, "Enter your password."),
});

export type LoginValues = z.infer<typeof loginSchema>;

// .email("Enter a valid email address.")
