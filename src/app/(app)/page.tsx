import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/lib/auth";
import { formatHospitalDay, formatMoney, formatWhen, hospitalHour } from "@/lib/format";
import { getDashboard } from "@/lib/hospital";
import { can } from "@/lib/permissions";
import { roleLabel } from "@/lib/roles";
import {
  IconActivity,
  IconBed,
  IconCash,
  IconPackage,
  IconReceipt,
  IconReceipt2,
  IconReportMoney,
  IconStethoscope,
  IconUserCog,
  IconUserPlus,
  IconUsers,
} from "@tabler/icons-react";
import Link from "next/link";
import type { ComponentType } from "react";

export default async function DashboardPage() {
  const user = await requireUser();
  const data = await getDashboard(user);
  const showPatients = can(user, "patients:view");
  const hour = hospitalHour();
  const firstName = user.name.trim().split(/\s+/)[0] || user.name;
  const bedTotal = data.beds.available + data.beds.occupied + data.beds.maintenance;

  const actions: Array<{
    href: string;
    label: string;
    icon: ComponentType<{ className?: string }>;
  }> = [{ href: "/beds", label: "Beds", icon: IconBed }];
  if (showPatients) actions.unshift({ href: "/patients", label: "Patients", icon: IconUsers });
  if (can(user, "inventory:view"))
    actions.push({ href: "/inventory", label: "Inventory", icon: IconPackage });
  if (can(user, "expenses:view"))
    actions.push({ href: "/expenses", label: "Expenses", icon: IconReceipt });
  if (can(user, "staff:manage"))
    actions.push({ href: "/staff", label: "Staff", icon: IconUserCog });

  return (
    <main className="flex flex-col gap-6">
      <header>
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {roleLabel(user.role)}
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
          {greeting(hour)}, {firstName}
        </h1>
        <p className="mt-1 text-sm leading-5 text-muted-foreground">
          {formatHospitalDay()} · {data.timeZone} · amounts in INR
        </p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Shortcuts">
        {actions.map((action, index) => {
          const ActionIcon = action.icon;
          const wide = actions.length % 2 === 1 && index === actions.length - 1;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={`rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${wide ? "col-span-2 sm:col-span-1" : ""}`}
            >
              <Card className="h-full transition-colors hover:bg-muted/70">
                <CardContent
                  className={
                    wide
                      ? "flex min-h-16 flex-row items-center gap-3 sm:min-h-22 sm:flex-col sm:items-start sm:justify-center"
                      : "flex min-h-22 flex-col justify-center gap-2.5"
                  }
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ActionIcon className="size-5" aria-hidden />
                  </span>
                  <span className="text-sm font-medium">{action.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </section>

      <section aria-label="Today" className="sm:grid sm:grid-cols-2 sm:gap-3 xl:grid-cols-4">
        <Card className="gap-0 divide-y py-0 sm:contents sm:divide-y-0">
          {showPatients ? (
            <Stat icon={IconActivity} label="Active OPD" value={String(data.activeOpd)} />
          ) : null}
          {showPatients ? (
            <Stat icon={IconStethoscope} label="Active IPD" value={String(data.activeIpd)} />
          ) : null}
          <Stat
            icon={IconBed}
            label="Beds free"
            value={String(data.beds.available)}
            detail={`${data.beds.occupied} occupied`}
          />
          {showPatients ? (
            <Stat icon={IconUserPlus} label="Registered today" value={String(data.patientsToday)} />
          ) : null}
          {data.feesToday !== null ? (
            <Stat icon={IconCash} label="Fees today" value={formatMoney(data.feesToday)} />
          ) : null}
          {data.chargesToday !== null ? (
            <Stat
              icon={IconReceipt2}
              label="Charges today"
              value={formatMoney(data.chargesToday)}
            />
          ) : null}
          {data.expensesToday !== null ? (
            <Stat
              icon={IconReportMoney}
              label="Expenses today"
              value={formatMoney(data.expensesToday)}
            />
          ) : null}
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Bed occupancy</CardTitle>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {data.beds.occupied}
            <span className="text-base font-normal text-muted-foreground"> / {bedTotal}</span>
          </p>
          <CardAction>
            <Button nativeButton={false} variant="link" render={<Link href="/beds" />}>
              Wards
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Progress
            value={data.beds.occupied}
            max={Math.max(bedTotal, 1)}
            aria-label="Occupied beds"
          />
          <dl className="divide-y sm:grid sm:grid-cols-3 sm:gap-3 sm:divide-y-0">
            <Count label="Free" value={data.beds.available} />
            <Count label="Occupied" value={data.beds.occupied} />
            <Count label="Maintenance" value={data.beds.maintenance} />
          </dl>
          {bedTotal === 0 ? (
            <Empty className="border-0 p-0">
              <EmptyHeader>
                <EmptyDescription>No beds have been added yet.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-5 lg:gap-5">
        {showPatients ? (
          <Card className="lg:col-span-3">
            <CardHeader className="border-b">
              <CardTitle>Recent visits</CardTitle>
              <CardAction>
                <Button nativeButton={false} variant="link" render={<Link href="/patients" />}>
                  All patients
                </Button>
              </CardAction>
            </CardHeader>
            {data.recent.length === 0 ? (
              <CardContent>
                <Empty className="border-0">
                  <EmptyHeader>
                    <EmptyDescription>No visits yet.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            ) : (
              <ItemGroup className="gap-0 divide-y">
                {data.recent.map((visit) => (
                  <Item
                    key={visit.id}
                    className="rounded-none px-4 py-4"
                    render={<Link href={`/visits/${visit.id}`} />}
                  >
                    <ItemMedia>
                      <Badge variant="secondary">{visit.visitType}</Badge>
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle>{visit.patient.name}</ItemTitle>
                      <ItemDescription>
                        {visit.status === "ACTIVE" ? "Active" : "Discharged"}
                        {visit.bed ? ` · Bed ${visit.bed.bedNumber}` : ""}
                        {" · "}
                        {formatWhen(visit.admissionDate)}
                      </ItemDescription>
                    </ItemContent>
                  </Item>
                ))}
              </ItemGroup>
            )}
          </Card>
        ) : null}

        {data.lowStock ? (
          <Card className="lg:col-span-2">
            <CardHeader className="border-b">
              <CardTitle>Low stock</CardTitle>
              <CardAction>
                <span className="text-xs text-muted-foreground">At or below {data.lowStockAt}</span>
              </CardAction>
            </CardHeader>
            {data.lowStock.length === 0 ? (
              <CardContent>
                <Empty className="border-0">
                  <EmptyHeader>
                    <EmptyDescription>Stock levels look fine.</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              </CardContent>
            ) : (
              <ItemGroup className="gap-0 divide-y">
                {data.lowStock.map((item) => (
                  <Item key={item.id} className="rounded-none px-4 py-4">
                    <ItemContent>
                      <ItemTitle>{item.itemName}</ItemTitle>
                    </ItemContent>
                    <Badge variant="destructive">
                      {item.quantity} {item.unit}
                    </Badge>
                  </Item>
                ))}
              </ItemGroup>
            )}
            <CardFooter>
              <Button
                nativeButton={false}
                variant="link"
                className="px-0"
                render={<Link href="/inventory" />}
              >
                Open inventory
              </Button>
            </CardFooter>
          </Card>
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
    <Card className="gap-0 rounded-none bg-transparent py-0 ring-0 sm:h-full sm:rounded-xl sm:bg-card sm:py-4 sm:ring-1">
      <CardContent className="flex items-start gap-3 px-4 py-4 sm:flex-1 sm:flex-col sm:items-stretch sm:gap-0">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary sm:hidden">
          <IconComponent className="size-5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
            <IconComponent className="hidden size-4 shrink-0 text-primary sm:block" aria-hidden />
          </div>
          <div className="mt-1 sm:mt-auto sm:pt-4">
            <p className="text-2xl font-semibold tracking-tight wrap-break-word tabular-nums">
              {value}
            </p>
            {detail ? <p className="mt-1 text-sm text-muted-foreground">{detail}</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Count({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 sm:block sm:rounded-xl sm:bg-muted/70 sm:px-3 sm:py-3 sm:text-center">
      <dt className="text-sm text-muted-foreground sm:text-xs">{label}</dt>
      <dd className="text-base font-semibold tabular-nums sm:mt-1 sm:text-lg">{value}</dd>
    </div>
  );
}
