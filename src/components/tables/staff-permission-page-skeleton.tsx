import { Skeleton } from "@/components/ui/skeleton";
import {
  PERMISSION_MATRIX,
  PERMISSION_MATRIX_COLUMNS,
  permissionMatrixMinWidth,
  permissionMatrixModuleWidth,
} from "@/lib/permission-matrix";

function TextBar({ text, className }: { text: string; className: string }) {
  return (
    <span className="relative block w-fit max-w-full">
      <span className={`invisible ${className}`} aria-hidden>
        {text}
      </span>
      <Skeleton className="absolute inset-0" />
    </span>
  );
}

function CheckBar() {
  return <Skeleton className="size-4 shrink-0 rounded-md" />;
}

export function StaffPermissionPageSkeleton({
  title = "Permissions",
  account = true,
  details = false,
}: {
  title?: string;
  account?: boolean;
  details?: boolean;
} = {}) {
  return (
    <main className="flex min-w-0 flex-col gap-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading {title.toLowerCase()}</span>
      <div className="min-w-0">
        <span className="relative inline-block max-w-full">
          <span
            className="invisible block text-2xl font-semibold tracking-tight sm:text-3xl"
            aria-hidden
          >
            {title}
          </span>
          <Skeleton className="absolute inset-0" />
        </span>
        {account ? (
          <>
            <div className="mt-1">
              <TextBar text="Account name" className="text-sm" />
            </div>
            <div className="mt-1">
              <TextBar text="Receptionist" className="text-sm font-medium" />
            </div>
          </>
        ) : null}
      </div>
      {details ? (
        <section className="min-w-0 rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10 sm:px-5">
          <TextBar text="Account" className="text-sm font-medium" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-11 rounded-lg" />
            ))}
          </div>
        </section>
      ) : null}
      <div className="flex w-full min-w-0 flex-col gap-6">
        <section className="min-w-0 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
          <div className="border-b px-4 py-4 sm:px-5">
            <TextBar text="Role & access" className="text-sm font-medium" />
            <div className="mt-1 max-w-3xl">
              <TextBar
                text="Choose what this account can use. Only Manage staff opens a screen today."
                className="text-sm"
              />
            </div>
          </div>
          <div className="xl:hidden">
            <div className="border-b bg-muted px-4 py-3">
              <span className="flex h-11 items-center gap-2">
                <CheckBar />
                <TextBar text="All permissions" className="text-sm font-medium" />
              </span>
              <div className="mt-2 grid grid-cols-4 divide-x divide-border border-t border-border pt-2">
                {PERMISSION_MATRIX_COLUMNS.map((column) => (
                  <span key={column.id} className="flex flex-col items-center">
                    <TextBar text={column.label} className="text-xs font-medium" />
                    <span className="mt-1 flex h-11 items-center justify-center">
                      <CheckBar />
                    </span>
                  </span>
                ))}
              </div>
            </div>
            {PERMISSION_MATRIX.map((row) => (
              <div key={row.label} className="border-b px-4 py-1 last:border-b-0">
                <span className="flex h-11 items-center gap-2">
                  <CheckBar />
                  <TextBar text={row.label} className="text-sm font-medium" />
                </span>
                <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
                  {PERMISSION_MATRIX_COLUMNS.map((column) => (
                    <span key={column.id} className="flex h-11 items-center justify-center">
                      {column.id in row.cells ? <CheckBar /> : null}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto xl:block">
            <table
              className="w-full border-collapse text-sm"
              style={{ tableLayout: "fixed", minWidth: permissionMatrixMinWidth }}
            >
              <colgroup>
                <col style={{ width: permissionMatrixModuleWidth }} />
                {PERMISSION_MATRIX_COLUMNS.map((column) => (
                  <col key={column.id} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b bg-muted">
                  <th
                    className="sticky left-0 z-20 border-r bg-muted px-3 text-left whitespace-nowrap"
                    style={{ width: permissionMatrixModuleWidth }}
                  >
                    <span className="flex h-11 items-center gap-2">
                      <CheckBar />
                      <TextBar text="Module" className="text-sm font-medium" />
                    </span>
                  </th>
                  {PERMISSION_MATRIX_COLUMNS.map((column) => (
                    <th key={column.id} className="px-2">
                      <span className="flex h-11 items-center justify-center gap-2">
                        <CheckBar />
                        <TextBar text={column.label} className="text-sm font-medium" />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_MATRIX.map((row) => (
                  <tr key={row.label} className="border-b last:border-b-0">
                    <th
                      className="sticky left-0 z-10 border-r bg-card px-3 text-left whitespace-nowrap"
                      style={{ width: permissionMatrixModuleWidth }}
                    >
                      <span className="flex h-11 items-center gap-2">
                        <CheckBar />
                        <TextBar text={row.label} className="text-sm font-medium" />
                      </span>
                    </th>
                    {PERMISSION_MATRIX_COLUMNS.map((column) => (
                      <td key={column.id} className="px-2 text-center">
                        {column.id in row.cells ? (
                          <span className="inline-flex h-11 items-center justify-center">
                            <CheckBar />
                          </span>
                        ) : null}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="relative inline-flex">
            <span
              className="invisible inline-flex h-8 items-center px-2.5 text-sm font-medium"
              aria-hidden
            >
              Back
            </span>
            <Skeleton className="absolute inset-0 rounded-lg" />
          </span>
          <span className="flex gap-2">
            <span className="relative inline-flex">
              <span
                className="invisible inline-flex h-8 items-center px-2.5 text-sm font-medium"
                aria-hidden
              >
                Cancel
              </span>
              <Skeleton className="absolute inset-0 rounded-lg" />
            </span>
            <span className="relative inline-flex">
              <span
                className="invisible inline-flex h-8 items-center px-2.5 text-sm font-medium"
                aria-hidden
              >
                Save
              </span>
              <Skeleton className="absolute inset-0 rounded-lg" />
            </span>
          </span>
        </div>
      </div>
    </main>
  );
}
