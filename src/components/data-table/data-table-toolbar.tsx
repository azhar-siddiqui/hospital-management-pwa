"use client";

import { type Column, type RowData, Subscribe, type Table } from "@tanstack/react-table";
import { cn } from "cn";
import * as React from "react";

import type { DataTableFeatures } from "@/lib/data-table-features";

import { DataTableDateFilter } from "@/components/data-table/data-table-date-filter";
import { DataTableFacetedFilter } from "@/components/data-table/data-table-faceted-filter";
import { DataTableSliderFilter } from "@/components/data-table/data-table-slider-filter";
import { DataTableViewOptions } from "@/components/data-table/data-table-view-options";
import { IconPlaceholder } from "@/components/icon-placeholder";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconSearch } from "@tabler/icons-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "../ui/input-group";

interface DataTableToolbarProps<TData extends RowData> extends React.ComponentProps<"div"> {
  table: Table<DataTableFeatures, TData>;
}

export function DataTableToolbar<TData extends RowData>({
  table,
  children,
  className,
  ...props
}: DataTableToolbarProps<TData>) {
  const columns = React.useMemo(
    () => table.getAllColumns().filter((column) => column.getCanFilter()),
    [table],
  );

  function onReset() {
    table.resetColumnFilters(true);
    table.resetJoinOperator(true);
  }

  return (
    <div
      role="toolbar"
      aria-orientation="horizontal"
      className={cn("flex w-full flex-wrap items-start justify-between gap-2 p-1", className)}
      {...props}
    >
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {columns.map((column) => (
          <DataTableToolbarFilter key={column.id} column={column} />
        ))}
        <Subscribe source={table.atoms.columnFilters} selector={(filters) => filters.length > 0}>
          {(isFiltered) =>
            isFiltered && (
              <Button
                aria-label="Reset filters"
                variant="outline"
                className="border-dashed"
                onClick={onReset}
              >
                <IconPlaceholder
                  lucide="X"
                  tabler="IconX"
                  hugeicons="Cancel01Icon"
                  phosphor="XIcon"
                  remixicon="RiCloseLine"
                />
                Reset
              </Button>
            )
          }
        </Subscribe>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {children}
        <DataTableViewOptions table={table} align="end" />
      </div>
    </div>
  );
}
interface DataTableToolbarFilterProps<TData extends RowData> {
  column: Column<DataTableFeatures, TData>;
}

function DataTableToolbarFilter<TData extends RowData>({
  column,
}: DataTableToolbarFilterProps<TData>) {
  const columnMeta = column.columnDef.meta;
  if (!columnMeta?.variant) return null;

  const title = columnMeta.label ?? column.id;
  const placeholder = columnMeta.placeholder ?? columnMeta.label;

  switch (columnMeta.variant) {
    case "text":
      return (
        <DataTableFilterInput
          column={column}
          placeholder={placeholder}
          aria-label={title}
          className={columnMeta.className ?? "w-40 lg:w-56"}
        />
      );

    case "number":
      return (
        <div className="relative">
          <DataTableFilterInput
            column={column}
            type="number"
            inputMode="numeric"
            placeholder={placeholder}
            className={cn("w-30", columnMeta.unit && "pr-8")}
          />
          {columnMeta.unit && (
            <span className="absolute top-0 right-0 bottom-0 flex items-center rounded-r-md bg-accent px-2 text-xs text-muted-foreground border">
              {columnMeta.unit}
            </span>
          )}
        </div>
      );

    case "range":
      return <DataTableSliderFilter column={column} title={title} />;

    case "date":
    case "dateRange":
      return (
        <DataTableDateFilter
          column={column}
          title={title}
          multiple={columnMeta.variant === "dateRange"}
        />
      );

    case "select":
    case "multiSelect":
      return (
        <DataTableFacetedFilter
          column={column}
          title={title}
          options={columnMeta.options ?? []}
          multiple={columnMeta.variant === "multiSelect"}
        />
      );

    case "boolean":
      return <DataTableBooleanFilter column={column} title={title} />;

    default:
      return null;
  }
}

function DataTableBooleanFilter<TData extends RowData>({
  column,
  title,
}: {
  column: Column<DataTableFeatures, TData>;
  title: string;
}) {
  return (
    <Subscribe source={column.table.atoms.columnFilters} selector={() => column.getFilterValue()}>
      {(value) => (
        <Select
          value={typeof value === "string" && value !== "" ? value : null}
          onValueChange={(next) => {
            column.setFilterValue(next ?? undefined);
          }}
        >
          <SelectTrigger className="w-36" aria-label={title}>
            <SelectValue placeholder={title} className="capitalize" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            <SelectGroup>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      )}
    </Subscribe>
  );
}

function readFilterInputValue(value: unknown) {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value.join(",");
  }

  return "";
}

interface DataTableFilterInputProps<TData extends RowData> extends React.ComponentProps<"input"> {
  column: Column<DataTableFeatures, TData>;
}

function DataTableFilterInput<TData extends RowData>({
  column,
  type = "text",
  ...props
}: DataTableFilterInputProps<TData>) {
  return (
    <Subscribe source={column.table.atoms.columnFilters} selector={() => column.getFilterValue()}>
      {(filterValue) => (
        <InputGroup className={cn("max-w-sm", props.className)}>
          <InputGroupInput
            type={type}
            {...props}
            value={readFilterInputValue(filterValue)}
            onChange={(event) => column.setFilterValue(event.target.value || undefined)}
          />
          <InputGroupAddon>
            <IconSearch />
          </InputGroupAddon>
        </InputGroup>
      )}
    </Subscribe>
  );
}
