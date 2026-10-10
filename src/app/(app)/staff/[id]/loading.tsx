import { StaffPermissionPageSkeleton } from "@/components/tables/staff-permission-page-skeleton";

export default function Loading() {
  return <StaffPermissionPageSkeleton title="Edit staff" account={false} details />;
}
