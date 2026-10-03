import Link from "next/link";
import { notFound } from "next/navigation";
import { StartVisitForm } from "@/components/hospital/forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
        <Button nativeButton={false} variant="link" className="h-auto px-0" render={<Link href="/patients" />}>
          Patients
        </Button>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight break-words sm:text-3xl">{patient.name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {patient.phone}
          {patient.age !== null ? ` · ${patient.age} years` : ""}
          {patient.gender ? ` · ${patient.gender}` : ""}
        </p>
        {patient.address ? <p className="mt-1 text-sm">{patient.address}</p> : null}
      </div>

      {visitTypes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>New visit</CardTitle>
            {active.size > 0 ? (
              <CardDescription>
                Active now: {[...active].join(", ")}. A second active visit of the same type is rejected.
              </CardDescription>
            ) : null}
          </CardHeader>
          <CardContent>
            <StartVisitForm patientId={patient.id} visitTypes={visitTypes} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Visits</CardTitle>
        </CardHeader>
        {patient.visits.length === 0 ? (
          <CardContent>
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyDescription>No visits yet.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        ) : (
          <Table className="min-w-[36rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Admitted</TableHead>
                <TableHead>Fee</TableHead>
                <TableHead>Bed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patient.visits.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell>
                    <Link href={`/visits/${visit.id}`} className="font-medium hover:underline">
                      {visit.visitType}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant={visit.status === "ACTIVE" ? "default" : "secondary"}>
                      {visit.status === "ACTIVE" ? "Active" : "Discharged"}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatWhen(visit.admissionDate)}</TableCell>
                  <TableCell>{formatMoney(visit.consultationFee)}</TableCell>
                  <TableCell>{visit.bed?.bedNumber ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </main>
  );
}
