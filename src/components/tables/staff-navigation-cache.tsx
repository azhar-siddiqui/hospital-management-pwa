"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { StaffEditScreen } from "@/components/tables/staff-edit-screen";
import {
  clearPendingStaffEdit,
  getPendingStaffEdit,
  readStaffAccount,
  staffEditId,
  subscribeStaffEdit,
} from "@/lib/staff-account-cache";

export function StaffNavigationCache({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pendingId = useSyncExternalStore(subscribeStaffEdit, getPendingStaffEdit, () => null);
  const routeId = staffEditId(pathname);

  // Once the URL is the account, the route id is enough. Dropping the click flag
  // here lets Back show the list on the first render instead of the edit form.
  useEffect(() => {
    if (routeId && getPendingStaffEdit() === routeId) clearPendingStaffEdit();
  }, [routeId]);

  // The click flag lives for the whole tab. Clear it when this section unmounts
  // so a later visit to /staff does not reopen the edit form.
  useEffect(() => {
    return () => clearPendingStaffEdit();
  }, []);

  const id = routeId ?? pendingId;
  const account = id ? readStaffAccount(id) : null;
  if (account) {
    return (
      <StaffEditScreen
        userId={account.id}
        name={account.name}
        email={account.email}
        role={account.role}
        assigned={account.permissions}
      />
    );
  }

  return children;
}
