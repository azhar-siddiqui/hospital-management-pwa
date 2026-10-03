import { CreateDoctorForm } from "@/components/doctors/create-doctor-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/lib/auth";
import { listDoctors } from "@/lib/doctors";
import { formatWhen } from "@/lib/format";

export default async function DoctorsPage() {
  await requirePermission("doctors:manage");
  const doctors = await listDoctors();

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Doctors</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Referring doctors selected when a patient is registered. The visit keeps the name even if this record changes later.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add doctor</CardTitle>
          <CardDescription>Name is required. Specialty and phone help the front desk tell people apart.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateDoctorForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Directory</CardTitle>
        </CardHeader>
        {doctors.length === 0 ? (
          <CardContent>
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyDescription>No doctors yet.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        ) : (
          <Table className="min-w-[36rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.name}</TableCell>
                  <TableCell>{doctor.specialty || "—"}</TableCell>
                  <TableCell>{doctor.phone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatWhen(doctor.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </main>
  );
}
