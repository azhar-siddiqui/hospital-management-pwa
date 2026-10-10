import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { requireUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await requireUser();
  return <DashboardHome name={user.name} />;
}
