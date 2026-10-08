import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const staffColumns = [
  {
    width: 30,
    checkbox: true,
    headerClassName: "size-4 rounded-[4px]",
    cellClassName: "size-4 rounded-[4px]",
  },
  {
    width: 180,
    headerClassName: "h-8 -ml-1.5 rounded-lg",
    headerWidth: 77,
    cellClassName: "h-5",
    cellWidth: 102,
  },
  {
    width: 220,
    headerClassName: "h-8 -ml-1.5 rounded-lg",
    headerWidth: 74,
    cellClassName: "h-5",
    cellWidth: 210,
  },
  {
    width: 140,
    headerClassName: "h-8 -ml-1.5 rounded-lg",
    headerWidth: 67,
    cellClassName: "h-5",
    cellWidth: 61,
  },
  {
    width: 260,
    headerClassName: "h-8 -ml-1.5 rounded-lg",
    headerWidth: 98,
    cellClassName: "h-5 rounded-4xl",
    cellWidth: 72,
  },
  {
    width: 120,
    headerClassName: "h-8 -ml-1.5 rounded-lg",
    headerWidth: 67,
    cellClassName: "h-5 rounded-4xl",
    cellWidth: 75,
  },
  {
    width: 180,
    headerClassName: "h-8 -ml-1.5 rounded-lg",
    headerWidth: 82,
    cellClassName: "h-5",
    cellWidth: 135,
  },
  {
    width: 96,
    headerClassName: "h-8 -ml-1.5 rounded-lg",
    headerWidth: 67,
    cellClassName: "size-7 rounded-lg",
    pin: "end" as const,
  },
];

export function StaffHeaderSkeleton() {
  return (
    <div className="min-w-0">
      <Skeleton className="h-8 max-w-full sm:hidden" style={{ width: 53 }} />
      <Skeleton className="hidden h-9 max-w-full sm:block" style={{ width: 66 }} />
      <Skeleton className="mt-1 h-5 max-w-full" style={{ width: 171 }} />
      <Skeleton className="mt-1 h-5 max-w-full" style={{ width: 63 }} />
    </div>
  );
}

export function StaffControlsSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-8" />
        <div className="flex">
          <Skeleton className="h-7 rounded-l-lg rounded-r-none" style={{ width: 74 }} />
          <Skeleton className="h-7 rounded-l-none rounded-r-lg" style={{ width: 82 }} />
        </div>
      </div>
      <Separator orientation="vertical" className="max-sm:hidden" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-7" />
        <div className="flex">
          <Skeleton className="h-7 rounded-l-lg rounded-r-none" style={{ width: 64 }} />
          <Skeleton className="h-7 rounded-none" style={{ width: 93 }} />
          <Skeleton className="h-7 rounded-l-none rounded-r-lg" style={{ width: 94 }} />
        </div>
      </div>
    </div>
  );
}

export function StaffTableSkeleton() {
  return (
    <DataTableSkeleton
      columns={staffColumns}
      filters={[
        "h-8 w-full min-w-52 max-w-72 rounded-lg",
        { className: "h-8 shrink-0 rounded-lg", width: 73 },
        "h-8 w-36 shrink-0 rounded-lg",
        { className: "h-8 shrink-0 rounded-lg", width: 88 },
      ]}
      actions={[{ className: "h-8 w-24 shrink-0 rounded-lg" }]}
      viewOptionsClassName="hidden h-8 shrink-0 rounded-lg lg:flex"
      viewOptionsWidth={77}
    />
  );
}

export function StaffPageSkeleton() {
  return (
    <main className="flex min-w-0 flex-col gap-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading staff</span>
      <StaffHeaderSkeleton />
      <StaffControlsSkeleton />
      <StaffTableSkeleton />
    </main>
  );
}
