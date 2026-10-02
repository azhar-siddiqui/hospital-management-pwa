import Link from "next/link";
import type { ComponentType } from "react";
import {
  IconActivity,
  IconBed,
  IconCash,
  IconPackage,
  IconReceipt2,
  IconReportMoney,
  IconStethoscope,
  IconUserCog,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
import { requireUser } from "@/lib/auth";
import { formatHospitalDay, formatMoney, formatWhen, hospitalHour } from "@/lib/format";
import { getDashboard } from "@/lib/hospital";
import { can } from "@/lib/permissions";
import { roleLabel } from "@/lib/roles";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboard(user.role);
  const showPatients = can(user.role, "patients:view");
  const hour = hospitalHour();
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const bedTotal = data.beds.available + data.beds.occupied + data.beds.maintenance;
  const occupiedShare = bedTotal === 0 ? 0 : Math.round((data.beds.occupied / bedTotal) * 100);

  const actions: Array<{ href: string; label: string; icon: ComponentType<{ className?: string }> }> = [
    { href: "/beds", label: "Beds", icon: IconBed },
  ];
  if (showPatients) actions.unshift({ href: "/patients", label: "Patients", icon: IconUsers });
  if (can(user.role, "inventory:view")) actions.push({ href: "/inventory", label: "Inventory", icon: IconPackage });
  if (can(user.role, "staff:manage")) actions.push({ href: "/staff", label: "Staff", icon: IconUserCog });

  return (
    <main className="flex flex-col gap-5">
      <header>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {roleLabel(user.role)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {greeting(hour)}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatHospitalDay()} · {data.timeZone} · amounts in INR
        </p>
      </header>

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Shortcuts">
        {actions.map((action) => {
          const ActionIcon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex min-h-14 items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 outline-none transition-colors hover:bg-muted/70 focus-visible:ring-3 focus-visible:ring-ring/50 active:bg-muted"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                <ActionIcon className="size-5" aria-hidden />
              </span>
              <span className="text-sm font-medium">{action.label}</span>
            </Link>
          );
        })}
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {showPatients ? <Stat icon={IconActivity} label="Active OPD" value={String(data.activeOpd)} /> : null}
        {showPatients ? <Stat icon={IconStethoscope} label="Active IPD" value={String(data.activeIpd)} /> : null}
        <Stat icon={IconBed} label="Beds free" value={String(data.beds.available)} detail={`${data.beds.occupied} occupied`} />
        {showPatients ? <Stat icon={IconUserPlus} label="Registered today" value={String(data.patientsToday)} /> : null}
        {data.feesToday !== null ? <Stat icon={IconCash} label="Fees today" value={formatMoney(data.feesToday)} /> : null}
        {data.chargesToday !== null ? <Stat icon={IconReceipt2} label="Charges today" value={formatMoney(data.chargesToday)} /> : null}
        {data.expensesToday !== null ? <Stat icon={IconReportMoney} label="Expenses today" value={formatMoney(data.expensesToday)} /> : null}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-medium">Bed occupancy</h2>
            <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
              {data.beds.occupied}
              <span className="text-base font-normal text-muted-foreground"> / {bedTotal}</span>
            </p>
          </div>
          <Link href="/beds" className="text-sm font-medium text-primary hover:underline">
            Wards
          </Link>
        </div>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-muted"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={Math.max(bedTotal, 1)}
          aria-valuenow={data.beds.occupied}
          aria-label="Occupied beds"
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${occupiedShare}%` }} />
        </div>
        <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Count label="Free" value={data.beds.available} />
          <Count label="Occupied" value={data.beds.occupied} />
          <Count label="Maintenance" value={data.beds.maintenance} />
        </dl>
        {bedTotal === 0 ? <p className="mt-3 text-sm text-muted-foreground">No beds have been added yet.</p> : null}
      </section>

      <div className="grid gap-5 lg:grid-cols-5">
        {showPatients ? (
          <section className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-3">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="font-medium">Recent visits</h2>
              <Link href="/patients" className="text-sm font-medium text-primary hover:underline">
                All patients
              </Link>
            </div>
            {data.recent.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground">No visits yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.recent.map((visit) => (
                  <li key={visit.id}>
                    <Link
                      href={`/visits/${visit.id}`}
                      className="flex items-center gap-3 px-4 py-3.5 outline-none hover:bg-muted/60 focus-visible:bg-muted/60"
                    >
                      <span className="w-11 shrink-0 rounded-md bg-muted px-1.5 py-1 text-center text-xs font-semibold">
                        {visit.visitType}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{visit.patient.name}</span>
                        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                          {visit.status === "ACTIVE" ? "Active" : "Discharged"}
                          {visit.bed ? ` · Bed ${visit.bed.bedNumber}` : ""}
                          {" · "}
                          {formatWhen(visit.admissionDate)}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}

        {data.lowStock ? (
          <section className="overflow-hidden rounded-2xl border border-border bg-card lg:col-span-2">
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h2 className="font-medium">Low stock</h2>
              <span className="text-xs text-muted-foreground">At or below {data.lowStockAt}</span>
            </div>
            {data.lowStock.length === 0 ? (
              <p className="px-4 py-8 text-sm text-muted-foreground">Stock levels look fine.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.lowStock.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                    <span className="min-w-0 truncate font-medium">{item.itemName}</span>
                    <span className="shrink-0 rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                      {item.quantity} {item.unit}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t border-border px-4 py-3">
              <Link href="/inventory" className="text-sm font-medium text-primary hover:underline">
                Open inventory
              </Link>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Stat({
  icon: IconComponent,
  label,
  value,
  detail,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <article className="flex min-h-28 flex-col justify-between rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm text-muted-foreground">{label}</h2>
        <IconComponent className="size-4 shrink-0 text-primary" aria-hidden />
      </div>
      <p className="mt-3 text-xl font-semibold tracking-tight break-words tabular-nums sm:text-2xl">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
    </article>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-muted/70 px-2 py-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}
