/** Roles the seeded admin can create. The admin account itself comes from `.env`. */
export const STAFF_ROLES = ["RECEPTIONIST", "DOCTOR", "NURSE", "ASSISTANT"] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

const labels: Record<string, string> = {
  ADMIN: "Admin",
  RECEPTIONIST: "Receptionist",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  ASSISTANT: "Assistant",
};

export function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

export function roleLabel(role: string) {
  return labels[role] ?? role;
}
