import Link from "next/link";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/hospital/forms";
import { requirePermission } from "@/lib/auth";
import { formatMoney, formatWhen, roundMoney } from "@/lib/format";
import { getVisit } from "@/lib/hospital";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("patients:view");
  const { id } = await params;
  const visit = await getVisit(id);
  if (!visit) notFound();

  const chargesTotal = roundMoney(visit.serviceCharges.reduce((sum, charge) => sum + charge.total, 0));
  const billTotal = roundMoney(visit.consultationFee + chargesTotal);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <div className="flex items-center justify-between print:hidden">
        <Link href={`/visits/${visit.id}`} className="text-sm text-muted-foreground hover:underline">
          Back to visit
        </Link>
        <PrintButton />
      </div>
      <header>
        <p className="text-sm text-muted-foreground">Hospital receipt</p>
        <h1 className="text-2xl font-semibold">{visit.patient.name}</h1>
        <p className="text-sm">
          {visit.visitType} · {visit.patient.phone} · {formatWhen(visit.admissionDate)}
        </p>
      </header>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border">
            <th className="py-2 font-medium">Item</th>
            <th className="py-2 font-medium">Qty</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-border">
            <td className="py-2">Consultation</td>
            <td className="py-2">1</td>
            <td className="py-2 text-right">{formatMoney(visit.consultationFee)}</td>
          </tr>
          {visit.serviceCharges.map((charge) => (
            <tr key={charge.id} className="border-b border-border">
              <td className="py-2">{charge.serviceName}</td>
              <td className="py-2">{charge.quantity}</td>
              <td className="py-2 text-right">{formatMoney(charge.total)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-3 font-semibold" colSpan={2}>
              Total
            </td>
            <td className="py-3 text-right font-semibold">{formatMoney(billTotal)}</td>
          </tr>
        </tfoot>
      </table>
      {visit.referringDoctor ? <p className="text-sm">Referring doctor: {visit.referringDoctor}</p> : null}
      <p className="text-xs text-muted-foreground">Amounts in INR. This is a billing summary, not a tax invoice.</p>
    </main>
  );
}
