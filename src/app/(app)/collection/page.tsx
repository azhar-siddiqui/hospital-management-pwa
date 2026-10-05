import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";
import {
  collectionHref,
  getCollectionReport,
  type CollectionDay,
  type DoctorCollection,
} from "@/lib/collection";
import { requirePermission } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import { CollectionRangePicker } from "@/components/collection/range-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectField } from "@/components/field";

export default async function CollectionPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string | string[];
    to?: string | string[];
    month?: string | string[];
    doctor?: string | string[];
  }>;
}) {
  await requirePermission("reports:collection");
  const params = await searchParams;
  const report = await getCollectionReport({
    from: firstParam(params.from),
    to: firstParam(params.to),
    month: firstParam(params.month),
    doctor: firstParam(params.doctor),
  });
  const doctorOptions = doctorSelectOptions(report.doctors);
  const referring = report.referring[0];
  const consultation = report.consultation[0];

  return (
    <main className="flex w-full min-w-0 flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Collection</h1>
        <p className="mt-1 text-sm text-muted-foreground">{report.rangeLabel}</p>
      </header>

      <p className="text-sm text-muted-foreground">
        Patients are counted once. Fees use the visit date, and charges use the day they were added.
        A doctor&apos;s referring total and consultation total are kept separate.
      </p>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            key={`${report.fromKey}-${report.toKey}-${report.doctor?.id ?? "all"}`}
            method="get"
            action="/collection"
            className="grid gap-3 sm:grid-cols-2"
            aria-label="Collection filters"
          >
            <input type="hidden" name="from" value={report.fromKey} />
            <input type="hidden" name="to" value={report.toKey} />
            <div className="sm:col-span-2">
              <CollectionRangePicker
                fromKey={report.fromKey}
                toKey={report.toKey}
                latestKey={report.latestKey}
                label={report.rangeLabel}
                doctorId={report.doctor?.id ?? null}
              />
            </div>
            <SelectField
              label="Doctor"
              name="doctor"
              defaultValue={report.doctor?.id ?? "all"}
              options={doctorOptions}
            />
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Show
              </Button>
            </div>
          </form>
          {report.limited ? (
            <p className="mt-2 text-sm text-muted-foreground">
              Showing 366 days. Choose a shorter range to see an earlier date.
            </p>
          ) : null}
        </CardContent>
      </Card>

      {report.doctor && referring && consultation ? (
        <section className="flex flex-col gap-3" aria-label="Selected doctor">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold wrap-break-word">{report.doctor.name}</h2>
              {report.doctor.specialty ? (
                <p className="text-sm text-muted-foreground wrap-break-word">
                  {report.doctor.specialty}
                </p>
              ) : null}
            </div>
            <Link
              href={collectionHref({ fromKey: report.fromKey, toKey: report.toKey })}
              className="text-sm font-medium text-primary hover:underline"
            >
              All doctors
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <RoleCard title="Referring doctor" row={referring} />
            <RoleCard title="Consultation doctor" row={consultation} />
          </div>
        </section>
      ) : null}

      {report.doctor ? <h2 className="text-lg font-semibold">Whole hospital</h2> : null}
      <section className="grid gap-3 sm:grid-cols-3" aria-label="Collection summary">
        <Summary label="Patients attended" value={String(report.patients)} detail="Counted once" />
        <Summary
          label="Visits"
          value={String(report.visits)}
          detail={`${report.opd} OPD · ${report.ipd} IPD`}
        />
        <Summary
          label="Collection"
          value={formatMoney(report.collection)}
          detail={`Fees ${formatMoney(report.fees)} · Charges ${formatMoney(report.charges)}`}
        />
      </section>

      {report.doctor ? null : (
        <>
          <p className="text-sm text-muted-foreground">
            Each list uses the doctor named on the visit. The two lists are not added together.
          </p>
          <DoctorList
            title="Referring doctors"
            empty="No referring doctor on visits or charges in this range."
            rows={report.referring}
            fromKey={report.fromKey}
            toKey={report.toKey}
          />
          <DoctorList
            title="Consultation doctors"
            empty="No consultation doctor on visits or charges in this range."
            rows={report.consultation}
            fromKey={report.fromKey}
            toKey={report.toKey}
          />
          <Card>
            <CardHeader className="border-b">
              <CardTitle>By day</CardTitle>
            </CardHeader>
            <DayList days={report.days} empty={`No visits or charges from ${report.rangeLabel}.`} />
          </Card>
        </>
      )}
    </main>
  );
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function doctorSelectOptions(doctors: { id: string; name: string; specialty: string | null }[]) {
  const counts = new Map<string, number>();
  for (const doctor of doctors) counts.set(doctor.name, (counts.get(doctor.name) ?? 0) + 1);
  return [
    { value: "all", label: "All doctors" },
    ...doctors.map((doctor) => ({
      value: doctor.id,
      label:
        (counts.get(doctor.name) ?? 0) > 1 && doctor.specialty
          ? `${doctor.name} · ${doctor.specialty}`
          : doctor.name,
    })),
  ];
}

function Summary({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight wrap-break-word tabular-nums sm:text-3xl">
          {value}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function RoleCard({ title, row }: { title: string; row: DoctorCollection }) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tracking-tight wrap-break-word tabular-nums sm:text-3xl">
          {formatMoney(row.collection)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {countPhrase(row.patients, "patient", "patients")}
          {" · "}
          {countPhrase(row.visits, "visit", "visits")}
          {row.visits > 0 ? ` · ${row.opd} OPD · ${row.ipd} IPD` : ""}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Fees {formatMoney(row.fees)} · Charges {formatMoney(row.charges)}
        </p>
      </CardContent>
      <div className="border-t">
        <p className="px-4 pt-3 text-sm font-medium">By day</p>
        <DayList days={row.days} empty="No visits or charges in this range." />
      </div>
    </Card>
  );
}

function DoctorList({
  title,
  empty,
  rows,
  fromKey,
  toKey,
}: {
  title: string;
  empty: string;
  rows: DoctorCollection[];
  fromKey: string;
  toKey: string;
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      {rows.length === 0 ? (
        <CardContent>
          <p className="py-6 text-center text-sm text-muted-foreground">{empty}</p>
        </CardContent>
      ) : (
        <ul className="divide-y">
          {rows.map((row) => (
            <li key={row.key}>
              {row.id ? (
                <Link
                  href={collectionHref({ fromKey, toKey, doctorId: row.id })}
                  className="flex items-start justify-between gap-3 px-4 py-3 hover:bg-muted/70"
                >
                  <DoctorLine row={row} />
                  <IconChevronRight className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </Link>
              ) : (
                <div className="flex items-start justify-between gap-3 px-4 py-3">
                  <DoctorLine row={row} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function DoctorLine({ row }: { row: DoctorCollection }) {
  return (
    <>
      <div className="min-w-0">
        <p className="font-medium wrap-break-word">{row.name}</p>
        {row.specialty ? (
          <p className="text-sm text-muted-foreground wrap-break-word">{row.specialty}</p>
        ) : null}
        <p className="mt-0.5 text-sm text-muted-foreground">
          {countPhrase(row.patients, "patient", "patients")}
          {" · "}
          {countPhrase(row.visits, "visit", "visits")}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-medium tabular-nums">{formatMoney(row.collection)}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Fees {formatMoney(row.fees)}
          <br />
          Charges {formatMoney(row.charges)}
        </p>
      </div>
    </>
  );
}

function DayList({ days, empty }: { days: CollectionDay[]; empty: string }) {
  if (days.length === 0) {
    return <p className="px-4 py-6 text-center text-sm text-muted-foreground">{empty}</p>;
  }
  return (
    <ol className="divide-y">
      {days.map((day) => (
        <li key={day.key} className="flex items-start justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="font-medium">{day.label}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {day.visits > 0
                ? `${countPhrase(day.patients, "patient", "patients")} · ${countPhrase(day.visits, "visit", "visits")}`
                : "Charges only"}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-medium tabular-nums">{formatMoney(day.collection)}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Fees {formatMoney(day.fees)}
              <br />
              Charges {formatMoney(day.charges)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function countPhrase(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}
