import { Suspense } from "react";
import {
  AssignBedForm,
  ChargeForm,
  ClinicalNoteForm,
  DischargeForm,
} from "@/components/hospital/forms";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { RecordCount } from "@/components/data-table/record-count";
import { TableControlMenu } from "@/components/data-table/table-control-menu";
import { ChargesTable } from "@/components/tables/directory-tables";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { requirePermission } from "@/lib/auth";
import { formatMoney, formatWhen, roundMoney } from "@/lib/format";
import { getVisit, listAvailableBeds } from "@/lib/hospital";
import { can } from "@/lib/permissions";
import { queryVisitCharges } from "@/lib/record-queries";
import { chargeFilters, chargeSearch, readDataTableQuery, readTableMode } from "@/lib/table-search";
import { WARD_LABELS, type WardTypeName } from "@/lib/validation";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function VisitPage({ params, searchParams }: PageProps<"/visits/[id]">) {
  const user = await requirePermission("patients:view");
  const { id } = await params;
  const visit = await getVisit(id);
  if (!visit) notFound();

  const active = visit.status === "ACTIVE";
  const chargesTotal = roundMoney(
    visit.serviceCharges.reduce((sum, charge) => sum + charge.total, 0),
  );
  const billTotal = roundMoney(visit.consultationFee + chargesTotal);
  const beds =
    active && visit.visitType === "IPD" && !visit.bed && can(user, "beds:manage")
      ? await listAvailableBeds()
      : [];
  const parsed = await chargeSearch.parse(searchParams);
  const { dataMode, filterMode } = readTableMode(parsed);
  const charges = await queryVisitCharges(
    visit.id,
    readDataTableQuery(parsed, chargeFilters),
    dataMode,
  );

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Button
            nativeButton={false}
            variant="link"
            className="h-auto px-0 text-muted-foreground"
            render={<Link href={`/patients/${visit.patient.id}`} />}
          >
            {visit.patient.name}
          </Button>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
            {visit.visitType} visit
          </h1>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant={active ? "default" : "secondary"}>
              {active ? "Active" : "Discharged"}
            </Badge>
            admitted {formatWhen(visit.admissionDate)}
            {visit.dischargeDate ? ` · discharged ${formatWhen(visit.dischargeDate)}` : ""}
          </p>
        </div>
        <Button
          nativeButton={false}
          variant="outline"
          render={<Link href={`/visits/${visit.id}/receipt`} />}
        >
          Receipt
        </Button>
      </div>

      <Card>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <Info label="Phone" value={visit.patient.phone} />
          <Info label="Consultation fee" value={formatMoney(visit.consultationFee)} />
          <Info label="Referring doctor" value={visit.referringDoctor || "—"} />
          <Info label="Consultation doctor" value={visit.consultationDoctor || "—"} />
          <Info
            label="Bed"
            value={
              visit.bed
                ? `${visit.bed.bedNumber} · ${WARD_LABELS[visit.bed.wardType as WardTypeName] ?? visit.bed.wardType}`
                : "Not assigned"
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Note</CardTitle>
        </CardHeader>
        <CardContent>
          {active && can(user, "visits:note") ? (
            <ClinicalNoteForm visitId={visit.id} note={visit.clinicalNote ?? ""} />
          ) : (
            <p className="whitespace-pre-wrap text-sm">
              {visit.clinicalNote || "No note recorded."}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Charges</CardTitle>
          <CardAction>
            <p className="text-sm font-medium">Bill {formatMoney(billTotal)}</p>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <RecordCount total={charges.total} capped={charges.capped} />
          <Suspense fallback={<DataTableSkeleton columnCount={6} filterCount={3} />}>
            <TableControlMenu />
            <ChargesTable
              data={charges.rows}
              pageCount={charges.pageCount}
              dataMode={dataMode}
              filterMode={filterMode}
            />
          </Suspense>
          {active && can(user, "visits:charge") ? (
            <>
              <Separator />
              <ChargeForm visitId={visit.id} />
            </>
          ) : null}
        </CardContent>
      </Card>

      {beds.length > 0 ||
      (active && visit.visitType === "IPD" && !visit.bed && can(user, "beds:manage")) ? (
        <Card>
          <CardHeader>
            <CardTitle>Bed</CardTitle>
            {beds.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No beds are available. Add one from the beds page.
              </p>
            ) : null}
          </CardHeader>
          {beds.length > 0 ? (
            <CardContent>
              <AssignBedForm visitId={visit.id} beds={beds} />
            </CardContent>
          ) : null}
        </Card>
      ) : null}

      {active && can(user, "visits:discharge") ? (
        <Card>
          <CardHeader>
            <CardTitle>Discharge</CardTitle>
          </CardHeader>
          <CardContent>
            <DischargeForm visitId={visit.id} />
          </CardContent>
        </Card>
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
