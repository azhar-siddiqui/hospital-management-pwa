import { RecordCount } from "@/components/data-table/record-count";
import { TableControlMenu } from "@/components/data-table/table-control-menu";
import { StaffTable } from "@/components/tables/directory-tables";
import { StaffControlsSkeleton, StaffTableSkeleton } from "@/components/tables/staff-page-skeleton";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdmin } from "@/lib/auth";
import { queryStaff } from "@/lib/record-queries";
import { readDataTableQuery, readTableMode, staffFilters, staffSearch } from "@/lib/table-search";
import { IconPlus } from "@tabler/icons-react";
import Link from "next/link";
import { Suspense } from "react";

async function loadStaffDirectory(searchParams: PageProps<"/staff">["searchParams"]) {
  const parsed = await staffSearch.parse(searchParams);
  const { dataMode, filterMode } = readTableMode(parsed);
  const result = await queryStaff(readDataTableQuery(parsed, staffFilters), dataMode);
  return { ...result, dataMode, filterMode };
}

type StaffDirectory = Awaited<ReturnType<typeof loadStaffDirectory>>;

async function StaffRecordCount({ directory }: { directory: Promise<StaffDirectory> }) {
  const { total, capped } = await directory;
  return <RecordCount total={total} capped={capped} />;
}

async function StaffDirectoryTable({
  directory,
  currentUserId,
}: {
  directory: Promise<StaffDirectory>;
  currentUserId: string;
}) {
  const { rows, pageCount, dataMode, filterMode } = await directory;
  return (
    <>
      <TableControlMenu />
      <StaffTable
        data={rows}
        pageCount={pageCount}
        dataMode={dataMode}
        filterMode={filterMode}
        currentUserId={currentUserId}
      />
    </>
  );
}

export default async function StaffPage({ searchParams }: PageProps<"/staff">) {
  const user = await requireAdmin();
  const directory = loadStaffDirectory(searchParams);

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Staff</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Accounts that can sign in.</p>
          <Suspense fallback={<Skeleton className="mt-1 h-5 max-w-full" style={{ width: 63 }} />}>
            <StaffRecordCount directory={directory} />
          </Suspense>
        </div>
        <Button
          className="w-full sm:w-auto"
          nativeButton={false}
          render={<Link href="/staff/add-staff" />}
        >
          <IconPlus />
          Add staff
        </Button>
      </div>

      <Suspense
        fallback={
          <>
            <StaffControlsSkeleton />
            <StaffTableSkeleton />
          </>
        }
      >
        <StaffDirectoryTable directory={directory} currentUserId={user.id} />
      </Suspense>
    </main>
  );
}
