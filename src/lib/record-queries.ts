import { Prisma } from "@/generated/prisma/client";
import type { DataTableQuery } from "@/lib/data-table-types";
import {
  andWhere,
  buildOrderBy,
  buildWhere,
  CLIENT_ROW_CAP,
  type FieldSpec,
  pageCountFor,
  pageWindow,
} from "@/lib/data-table-prisma";
import { formatWhen } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { isSeededAdmin } from "@/lib/users";
import type { DataMode } from "@/lib/table-search";

export type TableResult<T> = {
  rows: T[];
  total: number;
  pageCount: number;
  capped: boolean;
};

const patientFields = {
  search: { kind: "string", path: ["name"], sortable: false, where: patientSearchWhere },
  name: { kind: "string", path: ["name"] },
  phone: { kind: "string", path: ["phone"] },
  age: { kind: "number", path: ["age"], optional: true },
  gender: { kind: "enum", path: ["gender"], optional: true },
  registeredAt: { kind: "date", path: ["createdAt"] },
} satisfies Record<string, FieldSpec>;

const doctorFields = {
  search: { kind: "string", path: ["name"], sortable: false, where: doctorSearchWhere },
  name: { kind: "string", path: ["name"] },
  specialty: { kind: "string", path: ["specialty"], optional: true },
  phone: { kind: "string", path: ["phone"], optional: true },
  createdAt: { kind: "date", path: ["createdAt"] },
} satisfies Record<string, FieldSpec>;

const staffFields = {
  search: { kind: "string", path: ["name"], sortable: false, where: staffSearchWhere },
  name: { kind: "string", path: ["name"] },
  email: { kind: "string", path: ["email"] },
  role: { kind: "enum", path: ["role"] },
  seeded: { kind: "boolean", path: ["seeded"], sortable: false, where: seededWhere },
  createdAt: { kind: "date", path: ["createdAt"] },
} satisfies Record<string, FieldSpec>;

const stockFields = {
  search: { kind: "string", path: ["itemName"], sortable: false, where: stockSearchWhere },
  itemName: { kind: "string", path: ["itemName"] },
  category: { kind: "enum", path: ["category"], optional: true },
  quantity: { kind: "number", path: ["quantity"] },
  unit: { kind: "string", path: ["unit"] },
  lastUpdated: { kind: "date", path: ["lastUpdated"] },
} satisfies Record<string, FieldSpec>;

const expenseFields = {
  expenseSearch: {
    kind: "string",
    path: ["description"],
    sortable: false,
    where: expenseSearchWhere,
  },
  description: { kind: "string", path: ["description"] },
  amount: { kind: "number", path: ["amount"] },
  loggedBy: { kind: "string", path: ["loggedBy", "name"] },
  expenseDate: { kind: "date", path: ["expenseDate"] },
} satisfies Record<string, FieldSpec>;

const visitFields = {
  search: { kind: "string", path: ["bed", "bedNumber"], sortable: false, where: visitSearchWhere },
  visitType: { kind: "enum", path: ["visitType"] },
  status: { kind: "enum", path: ["status"] },
  admissionDate: { kind: "date", path: ["admissionDate"] },
  consultationFee: { kind: "number", path: ["consultationFee"] },
  bed: { kind: "string", path: ["bed", "bedNumber"], optional: true },
} satisfies Record<string, FieldSpec>;

const chargeFields = {
  search: { kind: "string", path: ["serviceName"], sortable: false, where: chargeSearchWhere },
  serviceName: { kind: "string", path: ["serviceName"] },
  quantity: { kind: "number", path: ["quantity"] },
  unitPrice: { kind: "number", path: ["unitPrice"] },
  total: { kind: "number", path: ["total"] },
  createdAt: { kind: "date", path: ["createdAt"] },
} satisfies Record<string, FieldSpec>;

function orSearch<T>(
  filter: DataTableQuery["filters"][number],
  clauses: (text: string, exact: boolean) => T[],
): Record<string, unknown> | null {
  const text = (Array.isArray(filter.value) ? "" : filter.value).trim();
  if (!text) return null;
  const exact = filter.operator === "eq" || filter.operator === "ne";
  const fuzzy = filter.operator === "iLike" || filter.operator === "notILike";
  if (!exact && !fuzzy) return null;
  const parts = clauses(text, exact);
  if (parts.length === 0) return null;
  const match = { OR: parts };
  return filter.operator === "notILike" || filter.operator === "ne" ? { NOT: match } : match;
}

function insensitive(text: string, exact: boolean) {
  return exact
    ? { equals: text, mode: "insensitive" as const }
    : { contains: text, mode: "insensitive" as const };
}

function patientSearchWhere(filter: DataTableQuery["filters"][number]) {
  return orSearch(filter, (text, exact) => {
    const parts: Record<string, unknown>[] = exact
      ? [{ name: { equals: text, mode: "insensitive" } }, { phone: { equals: text } }]
      : [{ name: { contains: text, mode: "insensitive" } }, { phone: { contains: text } }];
    if (/^\d+$/.test(text)) {
      const age = Number(text);
      if (age <= 200) parts.push({ age });
    }
    return parts;
  });
}

function doctorSearchWhere(filter: DataTableQuery["filters"][number]) {
  return orSearch(filter, (text, exact): Prisma.DoctorWhereInput[] => [
    { name: insensitive(text, exact) },
    { specialty: insensitive(text, exact) },
    { phone: exact ? { equals: text } : { contains: text } },
  ]);
}

function staffSearchWhere(filter: DataTableQuery["filters"][number]) {
  return orSearch(filter, (text, exact): Prisma.UserWhereInput[] => [
    { name: insensitive(text, exact) },
    { email: insensitive(text, exact) },
  ]);
}

function stockSearchWhere(filter: DataTableQuery["filters"][number]) {
  return orSearch(filter, (text, exact): Prisma.InventoryWhereInput[] => [
    { itemName: insensitive(text, exact) },
    { unit: insensitive(text, exact) },
  ]);
}

function expenseSearchWhere(filter: DataTableQuery["filters"][number]) {
  return orSearch(filter, (text, exact): Prisma.ExpenseWhereInput[] => [
    { description: insensitive(text, exact) },
    { loggedBy: { name: insensitive(text, exact) } },
  ]);
}

function visitSearchWhere(filter: DataTableQuery["filters"][number]) {
  return orSearch(filter, (text, exact): Prisma.VisitWhereInput[] => [
    { bed: { is: { bedNumber: insensitive(text, exact) } } },
  ]);
}

function chargeSearchWhere(filter: DataTableQuery["filters"][number]) {
  return orSearch(filter, (text, exact): Prisma.ServiceChargeWhereInput[] => [
    { serviceName: insensitive(text, exact) },
  ]);
}

function seededWhere(filter: DataTableQuery["filters"][number]) {
  const raw = Array.isArray(filter.value) ? filter.value[0] : filter.value;
  if (raw !== "true" && raw !== "false") return null;
  const wantSeeded = filter.operator === "ne" ? raw !== "true" : raw === "true";
  const seeded = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!seeded) return wantSeeded ? { id: { in: [] as string[] } } : {};
  const match = { email: { equals: seeded, mode: "insensitive" as const } };
  return wantSeeded ? match : { NOT: match };
}

function latestVisitLabel(visit?: { visitType: string; status: string; admissionDate: Date }) {
  if (!visit) return "None";
  const status = visit.status === "ACTIVE" ? "Active" : "Discharged";
  return `${visit.visitType} · ${status} · ${formatWhen(visit.admissionDate)}`;
}

export type PatientTableRow = {
  id: string;
  name: string;
  phone: string;
  age: number | null;
  gender: string | null;
  registeredAt: number;
  latestVisit: string;
};

export async function queryPatients(
  query: DataTableQuery,
  mode: DataMode,
): Promise<TableResult<PatientTableRow>> {
  const where = buildWhere<Prisma.PatientWhereInput>(
    query.filters,
    query.joinOperator,
    patientFields,
  );
  const orderBy = buildOrderBy<Prisma.PatientOrderByWithRelationInput>(
    query.sorting,
    patientFields,
    [{ createdAt: "desc" }],
  );
  const select = {
    id: true,
    name: true,
    phone: true,
    age: true,
    gender: true,
    createdAt: true,
    visits: {
      orderBy: { admissionDate: "desc" as const },
      take: 1,
      select: { visitType: true, status: true, admissionDate: true },
    },
  } satisfies Prisma.PatientSelect;

  if (mode === "client") {
    const [patients, total] = await Promise.all([
      prisma.patient.findMany({ orderBy, take: CLIENT_ROW_CAP, select }),
      prisma.patient.count(),
    ]);
    return {
      rows: patients.map(toPatientRow),
      total,
      pageCount: 1,
      capped: patients.length < total,
    };
  }

  const { skip, take, perPage } = pageWindow(query);
  const [patients, total] = await Promise.all([
    prisma.patient.findMany({ where, orderBy, skip, take, select }),
    prisma.patient.count({ where }),
  ]);
  return {
    rows: patients.map(toPatientRow),
    total,
    pageCount: pageCountFor(total, perPage),
    capped: false,
  };
}

function toPatientRow(patient: {
  id: string;
  name: string;
  phone: string;
  age: number | null;
  gender: string | null;
  createdAt: Date;
  visits: { visitType: string; status: string; admissionDate: Date }[];
}): PatientTableRow {
  return {
    id: patient.id,
    name: patient.name,
    phone: patient.phone,
    age: patient.age,
    gender: patient.gender,
    registeredAt: patient.createdAt.getTime(),
    latestVisit: latestVisitLabel(patient.visits[0]),
  };
}

export type DoctorTableRow = {
  id: string;
  name: string;
  specialty: string | null;
  phone: string | null;
  createdAt: number;
};

export async function queryDoctors(
  query: DataTableQuery,
  mode: DataMode,
): Promise<TableResult<DoctorTableRow>> {
  const where = buildWhere<Prisma.DoctorWhereInput>(
    query.filters,
    query.joinOperator,
    doctorFields,
  );
  const orderBy = buildOrderBy<Prisma.DoctorOrderByWithRelationInput>(query.sorting, doctorFields, [
    { name: "asc" },
  ]);
  const select = {
    id: true,
    name: true,
    specialty: true,
    phone: true,
    createdAt: true,
  } satisfies Prisma.DoctorSelect;
  return loadRows({
    mode,
    query,
    scope: {},
    where,
    orderBy,
    find: (args) => prisma.doctor.findMany({ ...(args as Prisma.DoctorFindManyArgs), select }),
    count: (args) => prisma.doctor.count(args as Prisma.DoctorCountArgs),
    map: (doctor) => ({ ...doctor, createdAt: doctor.createdAt.getTime() }),
  });
}

export type StaffTableRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  seeded: boolean;
  createdAt: number;
};

export async function queryStaff(
  query: DataTableQuery,
  mode: DataMode,
): Promise<TableResult<StaffTableRow>> {
  const where = buildWhere<Prisma.UserWhereInput>(query.filters, query.joinOperator, staffFields);
  const orderBy = buildOrderBy<Prisma.UserOrderByWithRelationInput>(query.sorting, staffFields, [
    { createdAt: "asc" },
  ]);
  const select = {
    id: true,
    name: true,
    email: true,
    role: true,
    createdAt: true,
  } satisfies Prisma.UserSelect;
  return loadRows({
    mode,
    query,
    scope: {},
    where,
    orderBy,
    find: (args) => prisma.user.findMany({ ...(args as Prisma.UserFindManyArgs), select }),
    count: (args) => prisma.user.count(args as Prisma.UserCountArgs),
    map: (user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      seeded: isSeededAdmin(user.email),
      createdAt: user.createdAt.getTime(),
    }),
  });
}

export type StockTableRow = {
  id: string;
  itemName: string;
  category: string | null;
  quantity: number;
  unit: string;
  lastUpdated: number;
};

export async function queryStock(
  query: DataTableQuery,
  mode: DataMode,
): Promise<TableResult<StockTableRow>> {
  const where = buildWhere<Prisma.InventoryWhereInput>(
    query.filters,
    query.joinOperator,
    stockFields,
  );
  const orderBy = buildOrderBy<Prisma.InventoryOrderByWithRelationInput>(
    query.sorting,
    stockFields,
    [{ itemName: "asc" }],
  );
  const select = {
    id: true,
    itemName: true,
    category: true,
    quantity: true,
    unit: true,
    lastUpdated: true,
  } satisfies Prisma.InventorySelect;
  return loadRows({
    mode,
    query,
    scope: {},
    where,
    orderBy,
    find: (args) =>
      prisma.inventory.findMany({ ...(args as Prisma.InventoryFindManyArgs), select }),
    count: (args) => prisma.inventory.count(args as Prisma.InventoryCountArgs),
    map: (item) => ({ ...item, lastUpdated: item.lastUpdated.getTime() }),
  });
}

export type ExpenseTableRow = {
  id: string;
  description: string;
  amount: number;
  loggedBy: string;
  expenseDate: number;
};

export async function queryExpenses(
  query: DataTableQuery,
  mode: DataMode,
): Promise<TableResult<ExpenseTableRow>> {
  const where = buildWhere<Prisma.ExpenseWhereInput>(
    query.filters,
    query.joinOperator,
    expenseFields,
  );
  const orderBy = buildOrderBy<Prisma.ExpenseOrderByWithRelationInput>(
    query.sorting,
    expenseFields,
    [{ expenseDate: "desc" }],
  );
  const select = {
    id: true,
    description: true,
    amount: true,
    expenseDate: true,
    loggedBy: { select: { name: true } },
  } satisfies Prisma.ExpenseSelect;
  return loadRows({
    mode,
    query,
    scope: {},
    where,
    orderBy,
    find: (args) => prisma.expense.findMany({ ...(args as Prisma.ExpenseFindManyArgs), select }),
    count: (args) => prisma.expense.count(args as Prisma.ExpenseCountArgs),
    map: (expense) => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      loggedBy: expense.loggedBy.name,
      expenseDate: expense.expenseDate.getTime(),
    }),
  });
}

export type VisitTableRow = {
  id: string;
  visitType: string;
  status: string;
  admissionDate: number;
  consultationFee: number;
  bed: string | null;
};

export async function queryPatientVisits(
  patientId: string,
  query: DataTableQuery,
  mode: DataMode,
): Promise<TableResult<VisitTableRow>> {
  const scope = { patientId };
  const filters = buildWhere<Prisma.VisitWhereInput>(
    query.filters,
    query.joinOperator,
    visitFields,
  );
  const where = andWhere<Prisma.VisitWhereInput>(scope, filters);
  const orderBy = buildOrderBy<Prisma.VisitOrderByWithRelationInput>(query.sorting, visitFields, [
    { admissionDate: "desc" },
  ]);
  const select = {
    id: true,
    visitType: true,
    status: true,
    admissionDate: true,
    consultationFee: true,
    bed: { select: { bedNumber: true } },
  } satisfies Prisma.VisitSelect;
  return loadRows({
    mode,
    query,
    scope,
    where,
    orderBy,
    find: (args) => prisma.visit.findMany({ ...(args as Prisma.VisitFindManyArgs), select }),
    count: (args) => prisma.visit.count(args as Prisma.VisitCountArgs),
    map: (visit) => ({
      id: visit.id,
      visitType: visit.visitType,
      status: visit.status,
      admissionDate: visit.admissionDate.getTime(),
      consultationFee: visit.consultationFee,
      bed: visit.bed?.bedNumber ?? null,
    }),
  });
}

export type ChargeTableRow = {
  id: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  createdAt: number;
};

export async function queryVisitCharges(
  visitId: string,
  query: DataTableQuery,
  mode: DataMode,
): Promise<TableResult<ChargeTableRow>> {
  const scope = { visitId };
  const filters = buildWhere<Prisma.ServiceChargeWhereInput>(
    query.filters,
    query.joinOperator,
    chargeFields,
  );
  const where = andWhere<Prisma.ServiceChargeWhereInput>(scope, filters);
  const orderBy = buildOrderBy<Prisma.ServiceChargeOrderByWithRelationInput>(
    query.sorting,
    chargeFields,
    [{ createdAt: "desc" }],
  );
  const select = {
    id: true,
    serviceName: true,
    quantity: true,
    unitPrice: true,
    total: true,
    createdAt: true,
  } satisfies Prisma.ServiceChargeSelect;
  return loadRows({
    mode,
    query,
    scope,
    where,
    orderBy,
    find: (args) =>
      prisma.serviceCharge.findMany({ ...(args as Prisma.ServiceChargeFindManyArgs), select }),
    count: (args) => prisma.serviceCharge.count(args as Prisma.ServiceChargeCountArgs),
    map: (charge) => ({ ...charge, createdAt: charge.createdAt.getTime() }),
  });
}

async function loadRows<TRecord, TRow>(options: {
  mode: DataMode;
  query: DataTableQuery;
  scope: unknown;
  where: unknown;
  orderBy: unknown;
  find: (args: {
    where?: unknown;
    orderBy: unknown;
    skip?: number;
    take?: number;
  }) => Promise<TRecord[]>;
  count: (args: { where?: unknown }) => Promise<number>;
  map: (record: TRecord) => TRow;
}): Promise<TableResult<TRow>> {
  if (options.mode === "client") {
    const scope = options.scope as never;
    const [records, total] = await Promise.all([
      options.find({ where: scope, orderBy: options.orderBy, take: CLIENT_ROW_CAP }),
      options.count({ where: scope }),
    ]);
    return {
      rows: records.map(options.map),
      total,
      pageCount: 1,
      capped: records.length < total,
    };
  }

  const { skip, take, perPage } = pageWindow(options.query);
  const where = options.where as never;
  const [records, total] = await Promise.all([
    options.find({ where, orderBy: options.orderBy, skip, take }),
    options.count({ where }),
  ]);
  return {
    rows: records.map(options.map),
    total,
    pageCount: pageCountFor(total, perPage),
    capped: false,
  };
}
