import Link from "next/link";
import { readAuditChanges, listActivity, subjectHref, subjectLabel } from "@/lib/audit";
import { requirePermission } from "@/lib/auth";
import { formatWhen } from "@/lib/format";
import { Button } from "@/components/ui/button";

export default async function ActivityPage({ searchParams }: PageProps<"/activity">) {
  await requirePermission("activity:view");
  const params = await searchParams;
  const requested = Number(params.page ?? "1");
  const page = Number.isInteger(requested) && requested > 0 ? requested : 1;
  const activity = await listActivity(page);

  return (
    <main className="flex w-full min-w-0 flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Activity</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Each save that changes a patient, a doctor, or a staff account is listed here. The old
          value is on the left and the new value is on the right.
        </p>
      </header>

      {activity.total === 0 ? (
        <div className="rounded-xl border border-dashed px-4 py-10 text-center">
          <p className="font-medium">No edits yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Saving a change on a patient, doctor, or staff account will show up here.
          </p>
        </div>
      ) : (
        <ol className="grid gap-3">
          {activity.rows.map((entry) => {
            const href = subjectHref(entry.subjectType, entry.subjectId);
            const changes = readAuditChanges(entry.changes);
            return (
              <li key={entry.id} className="min-w-0 rounded-xl border bg-card px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex h-5 items-center rounded-4xl bg-secondary px-2 text-xs font-medium text-secondary-foreground">
                    {subjectLabel(entry.subjectType)}
                  </span>
                  <time
                    className="text-xs text-muted-foreground"
                    dateTime={entry.createdAt.toISOString()}
                  >
                    {formatWhen(entry.createdAt)}
                  </time>
                </div>
                <h2 className="mt-2 text-base font-medium break-words">{entry.summary}</h2>
                <p className="mt-1 text-sm text-muted-foreground">By {entry.actorName}</p>
                <ul className="mt-3 grid gap-2">
                  {changes.map((change) => (
                    <li key={change.field} className="min-w-0 rounded-lg bg-muted/60 px-3 py-2">
                      <p className="text-sm font-medium">{change.label}</p>
                      <p className="mt-1 text-sm break-words">
                        <span className="text-muted-foreground">{change.from}</span>{" "}
                        <span className="text-muted-foreground">to</span>{" "}
                        <span className="font-medium">{change.to}</span>
                      </p>
                    </li>
                  ))}
                </ul>
                {href ? (
                  <Link
                    href={href}
                    className="mt-3 inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    Open record
                  </Link>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}

      {activity.pageCount > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Page {activity.page} of {activity.pageCount}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            {activity.page > 1 ? (
              <Button
                nativeButton={false}
                variant="outline"
                render={
                  <Link
                    href={activity.page === 2 ? "/activity" : `/activity?page=${activity.page - 1}`}
                  />
                }
              >
                Previous
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Previous
              </Button>
            )}
            {activity.page < activity.pageCount ? (
              <Button
                nativeButton={false}
                variant="outline"
                render={<Link href={`/activity?page=${activity.page + 1}`} />}
              >
                Next
              </Button>
            ) : (
              <Button variant="outline" disabled>
                Next
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
