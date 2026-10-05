import Link from "next/link";
import { CreateUserForm } from "@/components/staff/create-user-form";
import { Button } from "@/components/ui/button";
import { requireAdmin } from "@/lib/auth";
import { IconChevronLeft } from "@tabler/icons-react";

export default async function NewStaffPage() {
  await requireAdmin();

  return (
    <main className="flex w-full min-w-0 flex-col gap-6">
      <header>
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2 text-muted-foreground"
          render={<Link href="/staff" />}
        >
          <IconChevronLeft />
          Staff
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Add staff</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Name, email, and a password of at least 8 characters. Admin accounts are not created here.
        </p>
      </header>
      <CreateUserForm />
    </main>
  );
}
