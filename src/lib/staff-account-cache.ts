import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { isStaffRole, type StaffRole } from "@/lib/roles";

export type RememberedStaffAccount = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  permissions: Permission[];
};

const STAFF_EDIT_PATH =
  /^\/staff\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

const accounts = new Map<string, RememberedStaffAccount>();
let pendingId: string | null = null;
const listeners = new Set<() => void>();

export function staffEditId(pathname: string) {
  return STAFF_EDIT_PATH.exec(pathname)?.[1] ?? null;
}

export function readStaffAccount(id: string) {
  return accounts.get(id) ?? null;
}

export function beginStaffEdit(input: {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: readonly string[];
}) {
  if (!isStaffRole(input.role)) return;
  accounts.set(input.id, {
    id: input.id,
    name: input.name,
    email: input.email,
    role: input.role,
    permissions: PERMISSIONS.filter((permission) => input.permissions.includes(permission)),
  });
  pendingId = input.id;
  emit();
}

export function clearPendingStaffEdit() {
  if (!pendingId) return;
  pendingId = null;
  emit();
}

export function subscribeStaffEdit(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getPendingStaffEdit() {
  return pendingId;
}

function emit() {
  for (const listener of listeners) listener();
}
