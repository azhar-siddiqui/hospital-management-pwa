import type { ColumnFilterItem, DataTableQuery, JoinOperator } from "@/lib/data-table-types";
import { startOfHospitalDay } from "@/lib/format";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOTHING = { id: { in: [] as string[] } };

export const CLIENT_ROW_CAP = 500;
export const MAX_PAGE_SIZE = 100;

export type FieldKind = "string" | "number" | "date" | "enum" | "boolean";

export type FieldSpec = {
  kind: FieldKind;
  path: string[];
  optional?: boolean;
  sortable?: boolean;
  where?: (filter: ColumnFilterItem) => Record<string, unknown> | null;
};

export function pageWindow(query: DataTableQuery) {
  const perPage = Math.min(MAX_PAGE_SIZE, Math.max(1, query.perPage || 10));
  const page = Math.max(1, query.page || 1);
  return { page, perPage, skip: (page - 1) * perPage, take: perPage };
}

export function pageCountFor(total: number, perPage: number) {
  return Math.max(1, Math.ceil(total / perPage));
}

export function buildWhere<T>(
  filters: ColumnFilterItem[],
  join: JoinOperator,
  fields: Record<string, FieldSpec>,
): T {
  const parts = filters.flatMap((filter) => {
    const spec = fields[filter.id];
    if (!spec) return [];
    const node = spec.where ? spec.where(filter) : condition(spec, filter);
    return node ? [node] : [];
  });
  if (parts.length === 0) return {} as T;
  if (parts.length === 1) return parts[0] as T;
  return (join === "or" ? { OR: parts } : { AND: parts }) as T;
}

export function andWhere<T>(base: T, extra: Record<string, unknown>): T {
  const hasBase = base && typeof base === "object" && Object.keys(base).length > 0;
  if (Object.keys(extra).length === 0) return base;
  if (!hasBase) return extra as T;
  return { AND: [base, extra] } as T;
}

export function buildOrderBy<T>(
  sorting: DataTableQuery["sorting"],
  fields: Record<string, FieldSpec>,
  fallback: T[],
): T[] {
  const items = sorting.flatMap((sort) => {
    const spec = fields[sort.id];
    if (!spec || spec.sortable === false) return [];
    const direction = sort.desc ? "desc" : "asc";
    return [atPath(spec.path, direction) as T];
  });
  const chosen = items.length > 0 ? items : fallback;
  return [...chosen, { id: "asc" } as T];
}

function condition(spec: FieldSpec, filter: ColumnFilterItem): Record<string, unknown> | null {
  const { operator } = filter;
  const text = Array.isArray(filter.value) ? "" : filter.value;

  if (operator === "isEmpty") return empty(spec, true);
  if (operator === "isNotEmpty") return empty(spec, false);

  if (operator === "iLike" || operator === "notILike") {
    if (!text) return null;
    const match = atPath(spec.path, { contains: text, mode: "insensitive" as const });
    return operator === "iLike" ? match : { NOT: match };
  }

  if (operator === "inArray" || operator === "notInArray") {
    const values = (Array.isArray(filter.value) ? filter.value : [filter.value]).filter(
      (value) => value !== "",
    );
    if (values.length === 0) return null;
    const match = atPath(spec.path, { in: values });
    if (operator === "inArray") return match;
    if (!spec.optional) return { NOT: match };
    return { OR: [atPath(spec.path, null), { NOT: match }] };
  }

  if (operator === "isRelativeToToday") {
    const window = relativeWindow(text);
    if (!window) return null;
    return atPath(spec.path, { gte: window.start, lte: window.end });
  }

  if (spec.kind === "boolean") {
    const raw = Array.isArray(filter.value) ? filter.value[0] : filter.value;
    if (raw !== "true" && raw !== "false") return null;
    const flag = operator === "ne" ? raw !== "true" : raw === "true";
    return atPath(spec.path, flag);
  }

  if (operator === "isBetween") {
    return between(spec, filter.value);
  }

  if (spec.kind === "date") {
    const stamp = time(text);
    if (stamp === null) return NOTHING;
    const day = hospitalDayWindow(stamp);
    if (operator === "eq") return atPath(spec.path, { gte: day.start, lte: day.end });
    if (operator === "ne") {
      return {
        NOT: atPath(spec.path, { gte: day.start, lte: day.end }),
      };
    }
    if (operator === "lt") return atPath(spec.path, { lt: day.end });
    if (operator === "lte") return atPath(spec.path, { lte: day.end });
    if (operator === "gt") return atPath(spec.path, { gt: day.start });
    if (operator === "gte") return atPath(spec.path, { gte: day.start });
    return null;
  }

  if (spec.kind === "number") {
    const amount = num(text);
    if (amount === null) return NOTHING;
    if (operator === "eq") return atPath(spec.path, amount);
    if (operator === "ne") return notEqual(spec, amount);
    if (operator === "lt") return atPath(spec.path, { lt: amount });
    if (operator === "lte") return atPath(spec.path, { lte: amount });
    if (operator === "gt") return atPath(spec.path, { gt: amount });
    if (operator === "gte") return atPath(spec.path, { gte: amount });
    return null;
  }

  if (operator === "eq") return atPath(spec.path, text);
  if (operator === "ne") return notEqual(spec, text);
  return null;
}

function between(
  spec: FieldSpec,
  value: ColumnFilterItem["value"],
): Record<string, unknown> | null {
  const pair = Array.isArray(value) ? value : [value, ""];
  const [rawStart, rawEnd] = [pair[0] ?? "", pair[1] ?? ""];
  const hasStart = rawStart.trim() !== "";
  const hasEnd = rawEnd.trim() !== "";
  if (!hasStart && !hasEnd) return null;

  if (spec.kind === "date") {
    const start = hasStart ? time(rawStart) : null;
    const end = hasEnd ? time(rawEnd) : null;
    if ((hasStart && start === null) || (hasEnd && end === null)) return NOTHING;
    const bounds: Record<string, Date> = {};
    if (start !== null) bounds.gte = hospitalDayWindow(start).start;
    if (end !== null) bounds.lte = hospitalDayWindow(end).end;
    return atPath(spec.path, bounds);
  }

  const start = hasStart ? num(rawStart) : null;
  const end = hasEnd ? num(rawEnd) : null;
  if ((hasStart && start === null) || (hasEnd && end === null)) return NOTHING;
  if (start !== null && end === null) return atPath(spec.path, start);
  if (start === null && end !== null) return atPath(spec.path, end);
  return atPath(spec.path, { gte: start, lte: end });
}

function empty(spec: FieldSpec, wantEmpty: boolean): Record<string, unknown> {
  if (spec.path.length > 1 && spec.optional) {
    const relation = { [spec.path[0]]: wantEmpty ? { is: null } : { isNot: null } };
    return relation;
  }
  if (spec.kind === "string") {
    if (wantEmpty) {
      return spec.optional
        ? { OR: [atPath(spec.path, null), atPath(spec.path, "")] }
        : atPath(spec.path, "");
    }
    const notBlank = atPath(spec.path, { not: "" });
    return spec.optional ? { AND: [atPath(spec.path, { not: null }), notBlank] } : notBlank;
  }
  if (!spec.optional) return wantEmpty ? NOTHING : {};
  return wantEmpty ? atPath(spec.path, null) : atPath(spec.path, { not: null });
}

function notEqual(spec: FieldSpec, value: string | number): Record<string, unknown> {
  const mismatch = atPath(spec.path, { not: value });
  if (!spec.optional) return mismatch;
  return { OR: [atPath(spec.path, null), mismatch] };
}

function atPath(path: string[], value: unknown): Record<string, unknown> {
  let node: unknown = value;
  for (let index = path.length - 1; index >= 0; index -= 1) {
    node = { [path[index]!]: node };
  }
  return node as Record<string, unknown>;
}

function num(value: string) {
  if (value.trim() === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function time(value: string) {
  if (value.trim() === "") return null;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function hospitalDayWindow(timestamp: number) {
  const start = startOfHospitalDay(new Date(timestamp));
  const next = startOfHospitalDay(new Date(start.getTime() + 36 * 60 * 60 * 1000));
  return { start, end: new Date(next.getTime() - 1) };
}

function relativeWindow(value: string) {
  const [amountRaw, unit] = value.split(" ");
  const amount = Number.parseInt(amountRaw ?? "", 10);
  if (Number.isNaN(amount) || !unit) return null;
  const now = Date.now();
  if (unit === "days") return hospitalDayWindow(now + amount * DAY_MS);
  if (unit === "weeks") {
    const start = hospitalDayWindow(now + amount * 7 * DAY_MS).start;
    return { start, end: hospitalDayWindow(start.getTime() + 6 * DAY_MS).end };
  }
  if (unit === "months") {
    const start = hospitalDayWindow(now + amount * 30 * DAY_MS).start;
    return { start, end: hospitalDayWindow(start.getTime() + 29 * DAY_MS).end };
  }
  return null;
}
