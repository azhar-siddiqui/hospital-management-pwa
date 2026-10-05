export const APP_ROLES = ["ADMIN", "RECEPTIONIST", "DOCTOR", "NURSE", "ASSISTANT"] as const;

export type AppRole = (typeof APP_ROLES)[number];

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

export const PERMISSION_GROUPS = [
  {
    label: "Patients",
    description: "The patient list, records, and registering someone new.",
    items: [
      {
        permission: "patients:view",
        label: "View patients",
        detail: "Opens Patients, each record, and their visits.",
      },
      {
        permission: "patients:register",
        label: "Register patients",
        detail: "Opens Add patient. The patient list still needs View patients.",
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
        detail: "Begins an OPD visit from a patient record.",
      },
      {
        permission: "visits:admit",
        label: "Admit an inpatient",
        detail: "Begins an IPD visit from a patient record.",
      },
      {
        permission: "visits:note",
        label: "Write a clinical note",
        detail: "Adds a note on an open visit.",
      },
      {
        permission: "visits:discharge",
        label: "Discharge a visit",
        detail: "Closes an open visit.",
      },
      {
        permission: "visits:charge",
        label: "Add a service charge",
        detail: "Adds a charge on an open visit.",
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
        detail: "Opens the bed board.",
      },
      {
        permission: "beds:manage",
        label: "Add beds and change status",
        detail:
          "Adds beds, marks one available or under maintenance, and assigns a bed. Opening the board still needs View beds.",
      },
    ],
  },
  {
    label: "Inventory",
    description: "Stock on hand.",
    items: [
      {
        permission: "inventory:view",
        label: "View stock",
        detail: "Opens Stock and shows low-stock warnings on the home screen.",
      },
      {
        permission: "inventory:manage",
        label: "Add items and update quantities",
        detail: "Adds stock items and changes quantities. Opening Stock still needs View stock.",
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
        detail: "Opens Expenses.",
      },
      {
        permission: "expenses:create",
        label: "Record an expense",
        detail: "Adds an expense. The expense list still needs View expenses.",
      },
    ],
  },
  {
    label: "Reports",
    description: "Today's figures on the home screen, and the collection report.",
    items: [
      {
        permission: "reports:fees",
        label: "See today's fees",
        detail: "Shows today's consultation fees on the home screen.",
      },
      {
        permission: "reports:charges",
        label: "See today's charges",
        detail: "Shows today's service charges on the home screen.",
      },
      {
        permission: "reports:expenses",
        label: "See today's expenses",
        detail: "Shows today's expenses on the home screen.",
      },
      {
        permission: "reports:collection",
        label: "View collection",
        detail:
          "Opens Collection for a date range, including referring and consultation totals for a doctor.",
      },
    ],
  },
  {
    label: "Administration",
    description: "Staff accounts, the doctor list, and the edit log.",
    items: [
      {
        permission: "staff:manage",
        label: "View the staff list",
        detail: "Opens Staff and adding an account. Only an admin can change permissions.",
      },
      {
        permission: "doctors:manage",
        label: "Add and view doctors",
        detail: "Opens Doctors and Add doctor.",
      },
      {
        permission: "activity:view",
        label: "View the edit log",
        detail: "Opens Activity, where each saved edit is listed.",
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

const grants: Record<AppRole, readonly Permission[]> = {
  ADMIN: PERMISSIONS,
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
};

export function isAppRole(value: string): value is AppRole {
  return (APP_ROLES as readonly string[]).includes(value);
}

export type AccessSubject = {
  role: string;
  permissions?: readonly string[] | null;
};

export function roleGrants(role: string): Permission[] {
  if (!isAppRole(role)) return [];
  return [...grants[role]];
}

export function can(subject: string | AccessSubject, permission: Permission) {
  if (typeof subject !== "string" && subject.role === "ADMIN") return true;
  const role = typeof subject === "string" ? subject : subject.role;
  const stored = typeof subject === "string" ? null : subject.permissions;
  const list = stored ?? roleGrants(role);
  return list.includes(permission);
}

export function permissionLabel(permission: string) {
  for (const group of PERMISSION_GROUPS) {
    for (const item of group.items) {
      if (item.permission === permission) return item.label;
    }
  }
  return permission;
}

export function permissionForPath(pathname: string): Permission | null {
  if (pathname === "/activity" || pathname.startsWith("/activity/")) {
    return "activity:view";
  }
  if (pathname === "/collection" || pathname.startsWith("/collection/")) {
    return "reports:collection";
  }
  if (pathname === "/staff" || pathname.startsWith("/staff/")) {
    return "staff:manage";
  }
  if (pathname === "/doctors" || pathname.startsWith("/doctors/")) {
    return "doctors:manage";
  }
  if (pathname === "/expenses" || pathname.startsWith("/expenses/")) {
    return "expenses:view";
  }
  if (pathname === "/inventory" || pathname.startsWith("/inventory/")) {
    return "inventory:view";
  }
  if (pathname === "/beds" || pathname.startsWith("/beds/")) {
    return "beds:view";
  }
  if (pathname === "/patients/new" || /^\/patients\/[^/]+\/edit$/.test(pathname)) {
    return "patients:register";
  }
  if (
    pathname === "/patients" ||
    pathname.startsWith("/patients/") ||
    pathname === "/visits" ||
    pathname.startsWith("/visits/")
  ) {
    return "patients:view";
  }
  return null;
}

const RETURN_PREFIXES = [
  "/staff",
  "/patients",
  "/visits",
  "/beds",
  "/inventory",
  "/expenses",
  "/doctors",
  "/collection",
];

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
  const allowed = RETURN_PREFIXES.some(
    (prefix) => value === prefix || value.startsWith(`${prefix}/`),
  );
  return allowed ? value : "/";
}
