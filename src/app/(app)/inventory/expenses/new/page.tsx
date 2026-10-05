import Link from "next/link";
import { ExpenseForm } from "@/components/hospital/forms";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { IconChevronLeft } from "@tabler/icons-react";

export default async function NewExpensePage() {
  await requirePermission("expenses:create");

  return (
    <main className="flex w-full min-w-0 flex-col gap-6">
      <header>
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2 text-muted-foreground"
          render={<Link href="/inventory" />}
        >
          <IconChevronLeft />
          Inventory
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Record expense</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Saved against your account. The amount cannot be edited later from this screen.
        </p>
      </header>
      <ExpenseForm />
    </main>
  );
}
