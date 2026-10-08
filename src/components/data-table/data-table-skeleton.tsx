import type * as React from "react";

import { cn } from "cn";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableSkeletonItem {
  className?: string;
  width?: number;
}

interface DataTableSkeletonColumn {
  width: number;
  headerClassName: string;
  cellClassName: string;
  headerWidth?: number;
  cellWidth?: number;
  checkbox?: boolean;
  size?: string;
}

interface DataTableSkeletonProps extends React.ComponentProps<"div"> {
  columnCount?: number;
  columns?: DataTableSkeletonColumn[];
  rowCount?: number;
  filterCount?: number;
  filters?: Array<string | DataTableSkeletonItem>;
  actions?: Array<string | DataTableSkeletonItem>;
  cellWidths?: string[];
  withViewOptions?: boolean;
  viewOptionsClassName?: string;
  viewOptionsWidth?: number;
  withPagination?: boolean;
  shrinkZero?: boolean;
}

function columnWidth(column: DataTableSkeletonColumn) {
  return column.width > 0 ? column.width : column.size;
}

function itemProps(item: string | DataTableSkeletonItem) {
  if (typeof item === "string") return { className: item };
  return {
    className: item.className,
    style: item.width === undefined ? undefined : { width: item.width },
  };
}

export function DataTableSkeleton({
  columnCount = 1,
  columns,
  rowCount = 10,
  filterCount = 0,
  filters,
  actions = [],
  cellWidths = ["auto"],
  withViewOptions = true,
  viewOptionsClassName = "hidden h-8 w-20 shrink-0 rounded-lg lg:flex",
  viewOptionsWidth,
  withPagination = true,
  shrinkZero = false,
  className,
  ...props
}: DataTableSkeletonProps) {
  const resolvedColumns =
    columns ??
    Array.from({ length: columnCount }, (_, index) => ({
      width: 0,
      headerClassName: "h-8 w-full rounded-lg",
      cellClassName: "h-5 w-full",
      checkbox: false,
      headerWidth: undefined,
      cellWidth: undefined,
      size: cellWidths[index % cellWidths.length] ?? "auto",
    }));
  const resolvedFilters =
    filters ?? Array.from({ length: filterCount }, () => "h-8 w-18 shrink-0 rounded-lg");
  const minWidth = columns?.reduce((total, column) => total + column.width, 0);

  return (
    <div className={cn("flex w-full min-w-0 flex-col gap-2.5", className)} {...props}>
      <div
        role="toolbar"
        aria-orientation="horizontal"
        className="flex w-full flex-wrap items-start justify-between gap-2 p-1"
      >
        <div className="flex flex-1 flex-wrap items-center gap-2">
          {resolvedFilters.map((filter, index) => (
            <Skeleton key={index} {...itemProps(filter)} />
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {actions.map((action, index) => (
            <Skeleton key={index} {...itemProps(action)} />
          ))}
          {withViewOptions ? (
            <Skeleton
              className={viewOptionsClassName}
              style={viewOptionsWidth === undefined ? undefined : { width: viewOptionsWidth }}
            />
          ) : null}
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table className="table-fixed" style={minWidth ? { minWidth } : undefined}>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {resolvedColumns.map((column, index) => (
                <TableHead
                  key={index}
                  className={cn("overflow-hidden", column.checkbox && "pr-0")}
                  style={{
                    width: columnWidth(column),
                    minWidth: shrinkZero ? columnWidth(column) : undefined,
                  }}
                >
                  <Skeleton
                    className={column.headerClassName}
                    style={
                      column.headerWidth === undefined ? undefined : { width: column.headerWidth }
                    }
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }, (_, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-transparent">
                {resolvedColumns.map((column, index) => (
                  <TableCell
                    key={index}
                    className={cn("overflow-hidden", column.checkbox && "pr-0")}
                    style={{
                      width: columnWidth(column),
                      minWidth: shrinkZero ? columnWidth(column) : undefined,
                    }}
                  >
                    <Skeleton
                      className={column.cellClassName}
                      style={
                        column.cellWidth === undefined ? undefined : { width: column.cellWidth }
                      }
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {withPagination ? (
        <div className="flex flex-col gap-2.5">
          <div className="flex w-full flex-col-reverse items-center justify-between gap-4 overflow-auto p-1 sm:flex-row sm:gap-8">
            <div className="flex-1">
              <Skeleton className="h-5" style={{ width: 109 }} />
            </div>
            <div className="flex flex-col-reverse items-center gap-4 sm:flex-row sm:gap-6 lg:gap-8">
              <div className="flex items-center space-x-2 pr-2">
                <Skeleton className="h-5" style={{ width: 100 }} />
                <Skeleton className="h-8 w-18 shrink-0 rounded-lg" />
              </div>
              <Skeleton className="h-5" style={{ width: 70 }} />
              <div className="flex items-center space-x-2">
                <Skeleton className="hidden size-8 rounded-lg lg:block" />
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="size-8 rounded-lg" />
                <Skeleton className="hidden size-8 rounded-lg lg:block" />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
