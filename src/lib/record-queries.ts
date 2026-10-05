import { Prisma } from "@/generated/prisma/client";
import type { DataTableQuery } from "@/lib/data-table-types";
import {
  buildOrderBy,
  buildWhere,
  CLIENT_ROW_CAP,
  type FieldSpec,
  pageCountFor,
  pageWindow,
} from "@/lib/data-table-prisma";
import { prisma } from "@/lib/prisma";
import type { DataMode } from "@/lib/table-search";
import { isSeededAdmin } from "@/lib/users";

export type TableResult<T> = {
  rows: T[];
  total: number;
  pageCount: number;
  capped: boolean;
};

const staffFields = {
  search: { kind: "string", path: ["name"], sortable: false, where: staffSearchWhere },
  name: { kind: "string", path: ["name"] },
  email: { kind: "string", path: ["email"] },
  role: { kind: "enum", path: ["role"] },
  seeded: { kind: "boolean", path: ["seeded"], sortable: false, where: seededWhere },
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

function staffSearchWhere(filter: DataTableQuery["filters"][number]) {
  return orSearch(filter, (text, exact): Prisma.UserWhereInput[] => [
    { name: insensitive(text, exact) },
    { email: insensitive(text, exact) },
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

async function loadRows<TRecord, TRow>(options: {
  mode: DataMode;
  query: DataTableQuery;
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
    const [records, total] = await Promise.all([
      options.find({ orderBy: options.orderBy, take: CLIENT_ROW_CAP }),
      options.count({}),
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
