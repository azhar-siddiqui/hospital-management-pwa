import { PrintButton } from "@/components/hospital/forms";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requirePermission } from "@/lib/auth";
import { formatMoney, formatWhen, roundMoney } from "@/lib/format";
import { getVisit } from "@/lib/hospital";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("patients:view");
  const { id } = await params;
  const visit = await getVisit(id);
  if (!visit) notFound();

  const chargesTotal = roundMoney(
    visit.serviceCharges.reduce((sum, charge) => sum + charge.total, 0),
  );
  const billTotal = roundMoney(visit.consultationFee + chargesTotal);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between print:hidden">
        <Button
          nativeButton={false}
          variant="link"
          className="h-auto px-0"
          render={<Link href={`/visits/${visit.id}`} />}
        >
          Back to visit
        </Button>
        <PrintButton />
      </div>
      <header>
        <p className="text-sm text-muted-foreground">Hospital receipt</p>
        <h1 className="text-2xl font-semibold">{visit.patient.name}</h1>
        <p className="text-sm">
          {[visit.visitType, visit.patient.phone, formatWhen(visit.admissionDate)]
            .filter((part) => part)
            .join(" · ")}
        </p>
      </header>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item</TableHead>
            <TableHead>Qty</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Consultation</TableCell>
            <TableCell>1</TableCell>
            <TableCell className="text-right">{formatMoney(visit.consultationFee)}</TableCell>
          </TableRow>
          {visit.serviceCharges.map((charge) => (
            <TableRow key={charge.id}>
              <TableCell>{charge.serviceName}</TableCell>
              <TableCell>{charge.quantity}</TableCell>
              <TableCell className="text-right">{formatMoney(charge.total)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right">{formatMoney(billTotal)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      {visit.referringDoctor ? (
        <p className="text-sm">Referring doctor: {visit.referringDoctor}</p>
      ) : null}
      {visit.consultationDoctor ? (
        <p className="text-sm">Consultation doctor: {visit.consultationDoctor}</p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Amounts in INR. This is a billing summary, not a tax invoice.
      </p>
    </main>
  );
}
