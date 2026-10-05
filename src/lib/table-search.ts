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

function tableParsers<F extends string, S extends string>(options: SearchOptions<F, S>) {
  const base = getDataTableSearchParams(options);
  const { page, perPage, sort, filters, joinOperator, ...columns } = base;
  return {
    ...columns,
    page,
    perPage,
    sort,
    filters,
    joinOperator,
  };
}

export const staffFilters = {
  search: "text",
  role: "multiSelect",
  seeded: "boolean",
  createdAt: "date",
} as const satisfies Record<string, FilterVariant>;

export const staffSearch = createSearchParamsCache({
  ...modeParsers,
  ...tableParsers({
    filterableColumns: staffFilters,
    sortableColumns: ["name", "email", "role", "createdAt"] as const,
    defaultSorting: [{ id: "createdAt", desc: false }],
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
