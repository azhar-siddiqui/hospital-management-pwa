import { CLIENT_ROW_CAP } from "@/lib/data-table-prisma";

export function RecordCount({ total, capped }: { total: number; capped: boolean }) {
  return (
    <p className="mt-1 text-sm text-muted-foreground">
      {total} {total === 1 ? "record" : "records"}
      {capped ? `. Browser mode loads the first ${CLIENT_ROW_CAP} for this sort.` : ""}
    </p>
  );
}
