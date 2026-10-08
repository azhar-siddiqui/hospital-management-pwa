export const APP_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "RECEPTIONIST",
  "DOCTOR",
  "NURSE",
  "ASSISTANT",
] as const;

export const PERMISSIONS = [
  "patients:view",
  "patients:register",
  "visits:opd",
  "visits:admit",
  "visits:note",
  "visits:discharge",
  "visits:charge",
  "beds:view",
  "beds:manage",
  "inventory:view",
  "inventory:manage",
  "expenses:view",
  "expenses:create",
  "reports:fees",
  "reports:charges",
  "reports:expenses",
  "reports:collection",
  "staff:manage",
  "doctors:manage",
  "activity:view",
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type AppRole = (typeof APP_ROLES)[number];

export const PERMISSION_GROUPS = [
  {
    label: "Patients",
    description: "The patient list, records, and registering someone new.",
    items: [
      {
        permission: "patients:view",
        label: "View patients",
        detail: "Patient list, each record, and their visits.",
      },
      {
        permission: "patients:register",
        label: "Register patients",
        detail: "Add a patient. The patient list still needs View patients.",
      },
    ],
  },
  {
    label: "Visits",
    description: "What they can do on an open visit.",
    items: [
      {
        permission: "visits:opd",
        label: "Start an outpatient visit",
        detail: "Begin an OPD visit from a patient record.",
      },
      {
        permission: "visits:admit",
        label: "Admit an inpatient",
        detail: "Begin an IPD visit from a patient record.",
      },
      {
        permission: "visits:note",
        label: "Write a clinical note",
        detail: "Add a note on an open visit.",
      },
      {
        permission: "visits:discharge",
        label: "Discharge a visit",
        detail: "Close an open visit.",
      },
      {
        permission: "visits:charge",
        label: "Add a service charge",
        detail: "Add a charge on an open visit.",
      },
    ],
  },
  {
    label: "Beds",
    description: "The ward board and bed changes.",
    items: [
      {
        permission: "beds:view",
        label: "View beds",
        detail: "See the bed board.",
      },
      {
        permission: "beds:manage",
        label: "Add beds and change status",
        detail: "Add beds, mark one available or under maintenance, and assign a bed.",
      },
    ],
  },
  {
    label: "Stock",
    description: "Medicines, equipment, and supplies.",
    items: [
      {
        permission: "inventory:view",
        label: "View stock",
        detail: "See quantities on hand.",
      },
      {
        permission: "inventory:manage",
        label: "Update stock",
        detail: "Add items and change quantities. Opening stock still needs View stock.",
      },
    ],
  },
  {
    label: "Expenses",
    description: "Money the hospital spends.",
    items: [
      {
        permission: "expenses:view",
        label: "View expenses",
        detail: "See recorded expenses.",
      },
      {
        permission: "expenses:create",
        label: "Record an expense",
        detail: "Add an expense. The expense list still needs View expenses.",
      },
    ],
  },
  {
    label: "Reports",
    description: "Today's figures, and the collection report.",
    items: [
      {
        permission: "reports:fees",
        label: "See today's fees",
        detail: "Today's consultation fees.",
      },
      {
        permission: "reports:charges",
        label: "See today's charges",
        detail: "Today's service charges.",
      },
      {
        permission: "reports:expenses",
        label: "See today's expenses",
        detail: "Today's expenses.",
      },
      {
        permission: "reports:collection",
        label: "View collection",
        detail: "Collection for a date range, including referring and consultation totals.",
      },
    ],
  },
  {
    label: "Administration",
    description: "Staff accounts, the doctor list, and the edit log.",
    items: [
      {
        permission: "staff:manage",
        label: "Manage staff",
        detail: "Open the staff directory and change permissions.",
      },
      {
        permission: "doctors:manage",
        label: "Manage doctors",
        detail: "Add and view doctors.",
      },
      {
        permission: "activity:view",
        label: "View the edit log",
        detail: "See each saved edit.",
      },
    ],
  },
] as const satisfies readonly {
  label: string;
  description: string;
  items: readonly { permission: Permission; label: string; detail: string }[];
}[];

type ListedPermission = (typeof PERMISSION_GROUPS)[number]["items"][number]["permission"];
type UnlistedPermission = Exclude<Permission, ListedPermission>;
const allPermissionsListed: [UnlistedPermission] extends [never] ? true : UnlistedPermission = true;
void allPermissionsListed;

const rolePermissionGrants = {
  RECEPTIONIST: [
    "patients:view",
    "patients:register",
    "visits:opd",
    "beds:view",
    "reports:fees",
    "reports:collection",
    "doctors:manage",
  ],
  DOCTOR: ["patients:view", "visits:note", "visits:discharge", "beds:view"],
  NURSE: [
    "patients:view",
    "patients:register",
    "visits:admit",
    "visits:note",
    "visits:discharge",
    "visits:charge",
    "beds:view",
    "beds:manage",
    "inventory:view",
    "reports:charges",
  ],
  ASSISTANT: [
    "patients:view",
    "beds:view",
    "inventory:view",
    "inventory:manage",
    "expenses:view",
    "expenses:create",
  ],
} as const satisfies Record<string, readonly Permission[]>;

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}

function permissionItem(permission: string) {
  for (const group of PERMISSION_GROUPS) {
    for (const item of group.items) {
      if (item.permission === permission) return item;
    }
  }
  return null;
}

export function permissionLabel(permission: string) {
  return permissionItem(permission)?.label ?? permission;
}

export function permissionDescription(permission: Permission) {
  return permissionItem(permission)?.detail ?? permission;
}

/** Keeps known permissions, in catalog order. Returns null when a value is unknown. */
export function normalizePermissions(values: readonly string[]): Permission[] | null {
  const unique = new Set(values.map((value) => value.trim()).filter(Boolean));
  for (const value of unique) {
    if (!isPermission(value)) return null;
  }
  return PERMISSIONS.filter((permission) => unique.has(permission));
}

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

export type AccessSubject = {
  role: string;
  permissions?: readonly string[] | null;
};

export function roleGrants(role: string): Permission[] {
  if (role === "ADMIN") return [...PERMISSIONS];
  if (role in rolePermissionGrants) {
    return [...rolePermissionGrants[role as keyof typeof rolePermissionGrants]];
  }
  return [];
}

export function can(subject: string | AccessSubject, permission: Permission) {
  if (typeof subject !== "string" && subject.role === "ADMIN") return true;
  const role = typeof subject === "string" ? subject : subject.role;
  const stored = typeof subject === "string" ? null : subject.permissions;
  const list = stored ?? roleGrants(role);
  return list.includes(permission);
}

export function permissionForPath(pathname: string): Permission | null {
  if (pathname === "/staff" || pathname.startsWith("/staff/")) return "staff:manage";
  return null;
}

export function safeReturnPath(value: string | null | undefined) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("%")
  ) {
    return "/";
  }
  if (value === "/staff" || value.startsWith("/staff/")) return value;
  return "/";
}
