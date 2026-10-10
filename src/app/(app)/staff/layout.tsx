import { StaffNavigationCache } from "@/components/tables/staff-navigation-cache";

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  return <StaffNavigationCache>{children}</StaffNavigationCache>;
}
