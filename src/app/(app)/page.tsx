import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export default async function HomePage() {
  const user = await requireUser();
  if (can(user, "staff:manage")) redirect("/staff");

  return (
    <main className="flex min-w-0 flex-col gap-2">
      <h1 className="text-2xl font-semibold tracking-tight">Signed in</h1>
      <p className="text-sm text-muted-foreground">This account cannot open the staff list.</p>
    </main>
  );
}
