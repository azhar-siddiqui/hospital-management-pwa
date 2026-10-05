import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  dashboardActivity,
  dashboardCollection,
  dashboardVisits,
  dashboardWards,
  freeBeds,
  occupiedBeds,
  opdToday,
  totalBeds,
} from "@/lib/dashboard-sample";
import { formatHospitalDay, hospitalHour } from "@/lib/format";
import { IconBed, IconCash, IconStethoscope, IconUsers } from "@tabler/icons-react";

const rupees = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function DashboardHome({ name }: { name: string }) {
  const hour = hospitalHour();
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const who = name.trim() || "there";
  const metrics = [
    {
      label: "OPD today",
      value: String(opdToday),
      hint: "4 still waiting",
      icon: IconStethoscope,
    },
    {
      label: "Inpatients",
      value: String(occupiedBeds),
      hint: "2 admitted today",
      icon: IconUsers,
    },
    {
      label: "Beds free",
      value: String(freeBeds),
      hint: `of ${totalBeds} beds`,
      icon: IconBed,
    },
    {
      label: "Collected today",
      value: rupees.format(dashboardCollection.today),
      hint: "Fees and charges",
      icon: IconCash,
    },
  ];

  return (
    <main className="flex min-w-0 flex-col gap-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight wrap-break-word sm:text-3xl">
          {hello}, {who}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {formatHospitalDay()} · Sample ward figures. These numbers are not read from the database.
        </p>
      </div>

      <section
        aria-label="Today"
        className="grid grid-cols-1 overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:bg-transparent sm:ring-0 xl:grid-cols-4"
      >
        {metrics.map((item) => {
          const Icon = item.icon;
          return (
            <article
              key={item.label}
              className="flex min-w-0 items-start gap-3 border-b border-border px-4 py-3.5 last:border-b-0 sm:rounded-xl sm:border-0 sm:bg-card sm:py-4 sm:ring-1 sm:ring-foreground/10"
            >
              <span
                className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
                aria-hidden
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="mt-0.5 text-xl font-semibold tracking-tight tabular-nums wrap-break-word">
                  {item.value}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
              </div>
            </article>
          );
        })}
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-5">
        <Card className="min-w-0 lg:col-span-3">
          <CardHeader className="border-b">
            <CardTitle>Today&apos;s board</CardTitle>
            <CardDescription>
              Latest five visits. The totals above cover the full day.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex min-w-0 flex-col">
              {dashboardVisits.map((visit) => (
                <li
                  key={visit.id}
                  className="flex min-w-0 items-start gap-3 border-b border-border py-3 last:border-b-0"
                >
                  <Badge variant={visit.kind === "IPD" ? "default" : "secondary"}>
                    {visit.kind}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-baseline justify-between gap-3">
                      <p className="min-w-0 truncate font-medium">{visit.patient}</p>
                      <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {visit.time}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {visit.doctor} · {visit.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="min-w-0 lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle>Beds</CardTitle>
            <CardDescription>
              {occupiedBeds} occupied · {freeBeds} free · {totalBeds} beds
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {dashboardWards.map((ward) => {
              const free = ward.beds - ward.occupied;
              const pct = Math.round((ward.occupied / ward.beds) * 100);
              return (
                <div key={ward.name} className="min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-medium">{ward.name}</p>
                    <p className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {ward.occupied}/{ward.beds}
                    </p>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                    role="meter"
                    aria-valuenow={ward.occupied}
                    aria-valuemin={0}
                    aria-valuemax={ward.beds}
                    aria-label={`${ward.name} occupied`}
                  >
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{free} free</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="border-b">
            <CardTitle>Collection</CardTitle>
            <CardDescription>October sample, in rupees.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums wrap-break-word">
                  {rupees.format(dashboardCollection.today)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">This month</p>
                <p className="mt-1 text-xl font-semibold tracking-tight tabular-nums wrap-break-word">
                  {rupees.format(dashboardCollection.month)}
                </p>
              </div>
            </div>
            <dl className="flex flex-col gap-3 border-t border-border pt-4">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="min-w-0 text-sm text-muted-foreground">Referring doctor</dt>
                <dd className="shrink-0 text-sm font-medium tabular-nums">
                  {rupees.format(dashboardCollection.referring)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="min-w-0 text-sm text-muted-foreground">Consultation doctor</dt>
                <dd className="shrink-0 text-sm font-medium tabular-nums">
                  {rupees.format(dashboardCollection.consultation)}
                </dd>
              </div>
            </dl>
          </CardContent>
          <CardFooter className="text-xs text-muted-foreground">
            Referring and consultation are listed separately.
          </CardFooter>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="border-b">
            <CardTitle>Recent activity</CardTitle>
            <CardDescription>Sample events from this morning.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex min-w-0 flex-col">
              {dashboardActivity.map((item) => (
                <li key={item.id} className="border-b border-border py-3 last:border-b-0">
                  <p className="text-sm wrap-break-word">{item.summary}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{item.when}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
