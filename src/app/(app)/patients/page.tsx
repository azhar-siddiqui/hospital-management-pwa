import Link from "next/link";
import { RegisterPatientForm } from "@/components/hospital/forms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/lib/auth";
import { formatWhen } from "@/lib/format";
import { PAGE_SIZE, listPatients } from "@/lib/hospital";
import { can } from "@/lib/permissions";
import { pageNumber, type VisitTypeName } from "@/lib/validation";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const user = await requirePermission("patients:view");
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 80);
  const page = pageNumber(params.page);
  const { patients, total } = await listPatients(query, page);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visitTypes = (["OPD", "IPD"] as const).filter((type) =>
    can(user.role, type === "OPD" ? "visits:opd" : "visits:admit"),
  ) as VisitTypeName[];

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Patients</h1>
        <p className="mt-1 text-sm text-muted-foreground">{total} matching records</p>
      </div>

      <form action="/patients" className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <Field className="sm:max-w-sm">
          <FieldLabel htmlFor="q" className="sr-only">
            Search patients
          </FieldLabel>
          <Input id="q" name="q" defaultValue={query} placeholder="Name or phone" maxLength={80} />
        </Field>
        <Button type="submit">Search</Button>
      </form>

      {can(user.role, "patients:register") && visitTypes.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Creates the patient and their first visit. A patient cannot have two active visits of the same type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterPatientForm visitTypes={visitTypes} />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        {patients.length === 0 ? (
          <CardContent>
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyDescription>No patients found.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        ) : (
          <Table className="min-w-[40rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Latest visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => {
                const latest = patient.visits[0];
                return (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <Link href={`/patients/${patient.id}`} className="font-medium hover:underline">
                        {patient.name}
                      </Link>
                    </TableCell>
                    <TableCell>{patient.phone}</TableCell>
                    <TableCell>{patient.age ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {latest
                        ? `${latest.visitType} · ${latest.status === "ACTIVE" ? "Active" : "Discharged"} · ${formatWhen(latest.admissionDate)}`
                        : "None"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      {pages > 1 ? (
        <Pagination className="mx-0 justify-between">
          <PaginationContent className="w-full justify-between">
            <PaginationItem>
              <PageLink query={query} page={page - 1} disabled={page <= 1} label="Previous" />
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 text-sm text-muted-foreground">
                Page {page} of {pages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PageLink query={query} page={page + 1} disabled={page >= pages} label="Next" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </main>
  );
}

function PageLink({
  query,
  page,
  disabled,
  label,
}: {
  query: string;
  page: number;
  disabled: boolean;
  label: string;
}) {
  if (disabled) {
    return (
      <Button variant="outline" disabled>
        {label}
      </Button>
    );
  }
  const href = query ? `/patients?q=${encodeURIComponent(query)}&page=${page}` : `/patients?page=${page}`;
  return (
    <PaginationLink href={href} size="default">
      {label}
    </PaginationLink>
  );
}
