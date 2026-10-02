import Link from "next/link";
import { BedStatusForm, CreateBedForm } from "@/components/hospital/forms";
import { requirePermission } from "@/lib/auth";
import { listBeds } from "@/lib/hospital";
import { can } from "@/lib/permissions";
import { BED_STATUS_LABELS, WARD_LABELS, WARD_TYPES } from "@/lib/validation";

export default async function BedsPage() {
  const user = await requirePermission("beds:view");
  const beds = await listBeds();
  const manage = can(user.role, "beds:manage");

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Beds</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          A bed can belong to one active visit. Occupied beds are freed on discharge.
        </p>
      </div>

      {manage ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-medium">Add bed</h2>
          <div className="mt-4">
            <CreateBedForm />
          </div>
        </section>
      ) : null}

      {beds.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-5 py-8 text-sm text-muted-foreground">
          No beds have been added.
        </p>
      ) : (
        WARD_TYPES.map((ward) => {
          const group = beds.filter((bed) => bed.wardType === ward);
          if (group.length === 0) return null;
          return (
            <section key={ward}>
              <h2 className="text-lg font-medium">{WARD_LABELS[ward]}</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((bed) => (
                  <li key={bed.id} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">Bed {bed.bedNumber}</p>
                        <p className="text-sm text-muted-foreground">{BED_STATUS_LABELS[bed.status]}</p>
                      </div>
                      <StatusDot status={bed.status} />
                    </div>
                    {bed.currentVisit ? (
                      <Link href={`/visits/${bed.currentVisit.id}`} className="text-sm font-medium hover:underline">
                        {bed.currentVisit.patient.name}
                      </Link>
                    ) : (
                      <p className="text-sm text-muted-foreground">Empty</p>
                    )}
                    {manage && bed.status !== "OCCUPIED" ? (
                      <BedStatusForm bedId={bed.id} status={bed.status} />
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </main>
  );
}

function StatusDot({ status }: { status: "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" }) {
  const tone =
    status === "AVAILABLE" ? "bg-primary" : status === "OCCUPIED" ? "bg-foreground" : "bg-destructive";
  return <span aria-hidden className={`mt-1 size-2.5 rounded-full ${tone}`} />;
}