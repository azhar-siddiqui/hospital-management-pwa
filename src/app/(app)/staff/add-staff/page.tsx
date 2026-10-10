import { AddStaffForm } from "@/components/tables/add-staff-form";
import { requireAdmin } from "@/lib/auth";

export default async function AddStaffPage() {
  await requireAdmin();

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Add staff</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Create an account and choose what it can use.
        </p>
      </div>
      <AddStaffForm />
    </main>
  );
}
