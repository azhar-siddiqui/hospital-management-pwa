import Link from "next/link";
import { RegisterPatientForm } from "@/components/hospital/forms";
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

      <form action="/patients" className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="q" className="sr-only">
          Search patients
        </label>
        <input
          id="q"
          name="q"
          defaultValue={query}
          placeholder="Name or phone"
          maxLength={80}
          className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm sm:max-w-sm"
        />
        <button type="submit" className="h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground">
          Search
        </button>
      </form>

      {can(user.role, "patients:register") && visitTypes.length > 0 ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-medium">Register</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            Creates the patient and their first visit. A patient cannot have two active visits of the same type.
          </p>
          <RegisterPatientForm visitTypes={visitTypes} />
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        {patients.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">No patients found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 font-medium">Name</th>
                  <th className="px-5 py-2 font-medium">Phone</th>
                  <th className="px-5 py-2 font-medium">Age</th>
                  <th className="px-5 py-2 font-medium">Latest visit</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => {
                  const latest = patient.visits[0];
                  return (
                    <tr key={patient.id} className="border-t border-border">
                      <td className="px-5 py-3">
                        <Link href={`/patients/${patient.id}`} className="font-medium hover:underline">
                          {patient.name}
                        </Link>
                      </td>
                      <td className="px-5 py-3">{patient.phone}</td>
                      <td className="px-5 py-3">{patient.age ?? "—"}</td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {latest ? `${latest.visitType} · ${latest.status === "ACTIVE" ? "Active" : "Discharged"} · ${formatWhen(latest.admissionDate)}` : "None"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pages > 1 ? (
        <nav className="flex items-center justify-between text-sm" aria-label="Pagination">
          <PageLink query={query} page={page - 1} disabled={page <= 1} label="Previous" />
          <span className="text-muted-foreground">
            Page {page} of {pages}
          </span>
          <PageLink query={query} page={page + 1} disabled={page >= pages} label="Next" />
        </nav>
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
    return <span className="text-muted-foreground">{label}</span>;
  }
  const href = query ? `/patients?q=${encodeURIComponent(query)}&page=${page}` : `/patients?page=${page}`;
  return (
    <Link href={href} className="font-medium hover:underline">
      {label}
    </Link>
  );
}
