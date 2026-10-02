import Link from "next/link";
import { notFound } from "next/navigation";
import { AssignBedForm, ChargeForm, ClinicalNoteForm, DischargeForm } from "@/components/hospital/forms";
import { requirePermission } from "@/lib/auth";
import { formatMoney, formatWhen, roundMoney } from "@/lib/format";
import { getVisit, listAvailableBeds } from "@/lib/hospital";
import { can } from "@/lib/permissions";
import { WARD_LABELS, type WardTypeName } from "@/lib/validation";

export default async function VisitPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("patients:view");
  const { id } = await params;
  const visit = await getVisit(id);
  if (!visit) notFound();

  const active = visit.status === "ACTIVE";
  const chargesTotal = roundMoney(visit.serviceCharges.reduce((sum, charge) => sum + charge.total, 0));
  const billTotal = roundMoney(visit.consultationFee + chargesTotal);
  const beds = active && visit.visitType === "IPD" && !visit.bed && can(user.role, "beds:manage")
    ? await listAvailableBeds()
    : [];

  return (
    <main className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={`/patients/${visit.patient.id}`} className="text-sm text-muted-foreground hover:underline">
            {visit.patient.name}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {visit.visitType} visit
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {active ? "Active" : "Discharged"} · admitted {formatWhen(visit.admissionDate)}
            {visit.dischargeDate ? ` · discharged ${formatWhen(visit.dischargeDate)}` : ""}
          </p>
        </div>
        <Link href={`/visits/${visit.id}/receipt`} className="text-sm font-medium text-primary hover:underline">
          Receipt
        </Link>
      </div>

      <section className="grid gap-3 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
        <Info label="Phone" value={visit.patient.phone} />
        <Info label="Consultation fee" value={formatMoney(visit.consultationFee)} />
        <Info label="Referring doctor" value={visit.referringDoctor || "—"} />
        <Info
          label="Bed"
          value={
            visit.bed
              ? `${visit.bed.bedNumber} · ${WARD_LABELS[visit.bed.wardType as WardTypeName] ?? visit.bed.wardType}`
              : "Not assigned"
          }
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-medium">Note</h2>
        {active && can(user.role, "visits:note") ? (
          <div className="mt-4">
            <ClinicalNoteForm visitId={visit.id} note={visit.clinicalNote ?? ""} />
          </div>
        ) : (
          <p className="mt-3 whitespace-pre-wrap text-sm">{visit.clinicalNote || "No note recorded."}</p>
        )}
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Charges</h2>
          <p className="text-sm font-medium">Bill {formatMoney(billTotal)}</p>
        </div>
        {visit.serviceCharges.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No service charges yet.</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 font-medium">Service</th>
                  <th className="py-2 font-medium">Qty</th>
                  <th className="py-2 font-medium">Unit</th>
                  <th className="py-2 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {visit.serviceCharges.map((charge) => (
                  <tr key={charge.id} className="border-t border-border">
                    <td className="py-2">{charge.serviceName}</td>
                    <td className="py-2">{charge.quantity}</td>
                    <td className="py-2">{formatMoney(charge.unitPrice)}</td>
                    <td className="py-2">{formatMoney(charge.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {active && can(user.role, "visits:charge") ? (
          <div className="mt-5 border-t border-border pt-5">
            <ChargeForm visitId={visit.id} />
          </div>
        ) : null}
      </section>

      {beds.length > 0 || (active && visit.visitType === "IPD" && !visit.bed && can(user.role, "beds:manage")) ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-medium">Bed</h2>
          {beds.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No beds are available. Add one from the beds page.</p>
          ) : (
            <div className="mt-4">
              <AssignBedForm visitId={visit.id} beds={beds} />
            </div>
          )}
        </section>
      ) : null}

      {active && can(user.role, "visits:discharge") ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-medium">Discharge</h2>
          <div className="mt-4">
            <DischargeForm visitId={visit.id} />
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span className="block text-sm text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </p>
  );
}
