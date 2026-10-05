import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AuditChange = {
  field: string;
  label: string;
  from: string;
  to: string;
};

export type AuditSubject = "patient" | "doctor" | "staff";

const PAGE_SIZE = 20;

export function showValue(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const text = String(value).trim();
  return text || "—";
}

export function fieldChanges(
  rows: { field: string; label: string; before: string; after: string }[],
): AuditChange[] {
  return rows
    .filter((row) => row.before !== row.after)
    .map((row) => ({ field: row.field, label: row.label, from: row.before, to: row.after }));
}

export function readAuditChanges(value: unknown): AuditChange[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    if (
      typeof row.label !== "string" ||
      typeof row.from !== "string" ||
      typeof row.to !== "string"
    ) {
      return [];
    }
    return [{ field: String(row.field ?? ""), label: row.label, from: row.from, to: row.to }];
  });
}

export function subjectHref(subjectType: string, subjectId: string) {
  if (subjectType === "patient") return `/patients/${subjectId}`;
  if (subjectType === "doctor") return `/doctors/${subjectId}/edit`;
  if (subjectType === "staff") return `/staff/${subjectId}/edit`;
  return null;
}

export function subjectLabel(subjectType: string) {
  if (subjectType === "patient") return "Patient";
  if (subjectType === "doctor") return "Doctor";
  if (subjectType === "staff") return "Staff";
  return "Record";
}

export async function writeAudit(
  db: Prisma.TransactionClient,
  input: {
    actorId: string;
    actorName: string;
    subjectType: AuditSubject;
    subjectId: string;
    subjectName: string;
    summary: string;
    changes: AuditChange[];
  },
) {
  if (input.changes.length === 0) return;
  await db.auditLog.create({
    data: {
      actorId: input.actorId,
      actorName: input.actorName,
      subjectType: input.subjectType,
      subjectId: input.subjectId,
      subjectName: input.subjectName,
      summary: input.summary,
      changes: input.changes,
    },
  });
}

export async function listActivity(page: number) {
  const total = await prisma.auditLog.count();
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(Math.max(page, 1), pageCount);
  const rows = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    skip: total === 0 ? 0 : (current - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
  });
  return { rows, total, page: current, pageCount };
}
