import Link from "next/link";
import { notFound } from "next/navigation";
import { StartVisitForm } from "@/components/hospital/forms";
import { requirePermission } from "@/lib/auth";
import { formatMoney, formatWhen } from "@/lib/format";
import { getPatient } from "@/lib/hospital";
import { can } from "@/lib/permissions";
import type { VisitTypeName } from "@/lib/validation";

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("patients:view");
  const { id } = await params;
  const patient = await getPatient(id);
  if (!patient) notFound();

  const visitTypes = (["OPD", "IPD"] as const).filter((type) =>
    can(user.role, type === "OPD" ? "visits:opd" : "visits:admit"),
  ) as VisitTypeName[];
  const active = new Set(patient.visits.filter((visit) => visit.status === "ACTIVE").map((visit) => visit.visitType));

  return (
    <main className="flex flex-col gap-8">
      <div>
        <Link href="/patients" className="text-sm text-muted-foreground hover:underline">
          Patients
        </Link>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight break-words sm:text-3xl">{patient.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {patient.phone}
          {patient.age !== null ? ` · ${patient.age} years` : ""}
          {patient.gender ? ` · ${patient.gender}` : ""}
        </p>
        {patient.address ? <p className="mt-1 text-sm">{patient.address}</p> : null}
      </div>

      {visitTypes.length > 0 ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-medium">New visit</h2>
          {active.size > 0 ? (
            <p className="mt-1 text-sm text-muted-foreground">
              Active now: {[...active].join(", ")}. A second active visit of the same type is rejected.
            </p>
          ) : null}
          <div className="mt-4">
            <StartVisitForm patientId={patient.id} visitTypes={visitTypes} />
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <h2 className="border-b border-border px-5 py-3 font-medium">Visits</h2>
        {patient.visits.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">No visits yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 font-medium">Type</th>
                  <th className="px-5 py-2 font-medium">Status</th>
                  <th className="px-5 py-2 font-medium">Admitted</th>
                  <th className="px-5 py-2 font-medium">Fee</th>
                  <th className="px-5 py-2 font-medium">Bed</th>
                </tr>
              </thead>
              <tbody>
                {patient.visits.map((visit) => (
                  <tr key={visit.id} className="border-t border-border">
                    <td className="px-5 py-3">
                      <Link href={`/visits/${visit.id}`} className="font-medium hover:underline">
                        {visit.visitType}
                      </Link>
                    </td>
                    <td className="px-5 py-3">{visit.status === "ACTIVE" ? "Active" : "Discharged"}</td>
                    <td className="px-5 py-3">{formatWhen(visit.admissionDate)}</td>
                    <td className="px-5 py-3">{formatMoney(visit.consultationFee)}</td>
                    <td className="px-5 py-3">{visit.bed?.bedNumber ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
