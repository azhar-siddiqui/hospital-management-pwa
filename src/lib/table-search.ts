import { createSearchParamsCache, parseAsStringEnum } from "nuqs/server";

import type { FilterVariant, QueryKeys } from "@/lib/data-table-types";
import { getDataTableQuery, getDataTableSearchParams } from "@/lib/parsers";
import type { ColumnFilterItem, ColumnSortItem, JoinOperator } from "@/lib/data-table-types";

export const DATA_MODES = ["server", "client"] as const;
export const FILTER_MODES = ["plain", "advanced", "command"] as const;

export type DataMode = (typeof DATA_MODES)[number];
export type FilterMode = (typeof FILTER_MODES)[number];

const modeParsers = {
  dataMode: parseAsStringEnum([...DATA_MODES]).withDefault("server"),
  filterMode: parseAsStringEnum([...FILTER_MODES]).withDefault("plain"),
};

type SearchOptions<F extends string, S extends string> = {
  filterableColumns: Record<F, FilterVariant>;
  sortableColumns?: readonly S[];
  defaultSorting?: ColumnSortItem<S>[];
  defaultPerPage?: number;
};

function tableParsers<F extends string, S extends string>(
  options: SearchOptions<F, S>,
  keys?: Partial<QueryKeys>,
) {
  const base = getDataTableSearchParams(options);
  const { page, perPage, sort, filters, joinOperator, ...columns } = base;
  return {
    ...columns,
    [keys?.page ?? "page"]: page,
    [keys?.perPage ?? "perPage"]: perPage,
    [keys?.sort ?? "sort"]: sort,
    [keys?.filters ?? "filters"]: filters,
    [keys?.joinOperator ?? "joinOperator"]: joinOperator,
  };
}

export const patientFilters = {
  search: "text",
  gender: "multiSelect",
  registeredAt: "date",
} as const satisfies Record<string, FilterVariant>;

export const doctorFilters = {
  search: "text",
  createdAt: "date",
} as const satisfies Record<string, FilterVariant>;

export const staffFilters = {
  search: "text",
  role: "multiSelect",
  seeded: "boolean",
  createdAt: "date",
} as const satisfies Record<string, FilterVariant>;

export const stockFilters = {
  search: "text",
  category: "multiSelect",
  quantity: "range",
  lastUpdated: "date",
} as const satisfies Record<string, FilterVariant>;

export const expenseFilters = {
  expenseSearch: "text",
  amount: "number",
  expenseDate: "dateRange",
} as const satisfies Record<string, FilterVariant>;

export const visitFilters = {
  search: "text",
  visitType: "select",
  status: "select",
  admissionDate: "date",
  consultationFee: "number",
} as const satisfies Record<string, FilterVariant>;

export const chargeFilters = {
  search: "text",
  quantity: "number",
  unitPrice: "number",
  total: "number",
  createdAt: "date",
} as const satisfies Record<string, FilterVariant>;

export const stockQueryKeys = {
  page: "stockPage",
  perPage: "stockPerPage",
  sort: "stockSort",
  filters: "stockFilters",
  joinOperator: "stockJoin",
} as const satisfies QueryKeys;

export const expenseQueryKeys = {
  page: "expensePage",
  perPage: "expensePerPage",
  sort: "expenseSort",
  filters: "expenseFilters",
  joinOperator: "expenseJoin",
} as const satisfies QueryKeys;

export const patientSearch = createSearchParamsCache({
  ...modeParsers,
  ...tableParsers({
    filterableColumns: patientFilters,
    sortableColumns: ["name", "phone", "age", "gender", "registeredAt"] as const,
    defaultSorting: [{ id: "registeredAt", desc: true }],
  }),
});

export const doctorSearch = createSearchParamsCache({
  ...modeParsers,
  ...tableParsers({
    filterableColumns: doctorFilters,
    sortableColumns: ["name", "specialty", "phone", "createdAt"] as const,
    defaultSorting: [{ id: "name", desc: false }],
  }),
});

export const staffSearch = createSearchParamsCache({
  ...modeParsers,
  ...tableParsers({
    filterableColumns: staffFilters,
    sortableColumns: ["name", "email", "role", "createdAt"] as const,
    defaultSorting: [{ id: "createdAt", desc: false }],
  }),
});

export const inventorySearch = createSearchParamsCache({
  ...modeParsers,
  ...tableParsers(
    {
      filterableColumns: stockFilters,
      sortableColumns: ["itemName", "category", "quantity", "unit", "lastUpdated"] as const,
      defaultSorting: [{ id: "itemName", desc: false }],
    },
    stockQueryKeys,
  ),
  ...tableParsers(
    {
      filterableColumns: expenseFilters,
      sortableColumns: ["description", "amount", "loggedBy", "expenseDate"] as const,
      defaultSorting: [{ id: "expenseDate", desc: true }],
    },
    expenseQueryKeys,
  ),
});

export const visitSearch = createSearchParamsCache({
  ...modeParsers,
  ...tableParsers({
    filterableColumns: visitFilters,
    sortableColumns: ["visitType", "status", "admissionDate", "consultationFee", "bed"] as const,
    defaultSorting: [{ id: "admissionDate", desc: true }],
  }),
});

export const chargeSearch = createSearchParamsCache({
  ...modeParsers,
  ...tableParsers({
    filterableColumns: chargeFilters,
    sortableColumns: ["serviceName", "quantity", "unitPrice", "total", "createdAt"] as const,
    defaultSorting: [{ id: "createdAt", desc: true }],
  }),
});

export function readDataTableQuery<F extends string>(
  parsed: Record<string, unknown>,
  filterableColumns: Record<F, FilterVariant>,
  keys?: Partial<QueryKeys>,
) {
  const columns = Object.fromEntries(
    (Object.keys(filterableColumns) as F[]).map((id) => [id, parsed[id]]),
  ) as Partial<Record<F, unknown>>;

  return getDataTableQuery(
    {
      page: parsed[keys?.page ?? "page"] as number,
      perPage: parsed[keys?.perPage ?? "perPage"] as number,
      sort: parsed[keys?.sort ?? "sort"] as ColumnSortItem[],
      filters: parsed[keys?.filters ?? "filters"] as ColumnFilterItem<F>[],
      joinOperator: parsed[keys?.joinOperator ?? "joinOperator"] as JoinOperator,
      ...columns,
    },
    filterableColumns,
  );
}

export function readTableMode(parsed: { dataMode: DataMode; filterMode: FilterMode }) {
  return { dataMode: parsed.dataMode, filterMode: parsed.filterMode };
}
