import Link from "next/link";
import { CreateDoctorForm } from "@/components/doctors/create-doctor-form";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth";
import { IconChevronLeft } from "@tabler/icons-react";

export default async function NewDoctorPage() {
  await requirePermission("doctors:manage");

  return (
    <main className="flex w-full min-w-0 flex-col gap-6">
      <header>
        <Button
          nativeButton={false}
          variant="ghost"
          size="sm"
          className="-ml-2 h-8 px-2 text-muted-foreground"
          render={<Link href="/doctors" />}
        >
          <IconChevronLeft />
          Doctors
        </Button>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Add doctor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Name is required. Specialty and phone help the front desk tell people apart. A visit keeps
          the doctor&apos;s name even if this record changes later.
        </p>
      </header>
      <CreateDoctorForm />
    </main>
  );
}
