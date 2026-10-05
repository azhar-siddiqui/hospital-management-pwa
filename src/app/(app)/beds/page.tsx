import Link from "next/link";
import { BedStatusForm } from "@/components/hospital/forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { requirePermission } from "@/lib/auth";
import { listBeds } from "@/lib/hospital";
import { can } from "@/lib/permissions";
import { BED_STATUS_LABELS, WARD_LABELS, WARD_TYPES } from "@/lib/validation";
import { IconPlus } from "@tabler/icons-react";

export default async function BedsPage() {
  const user = await requirePermission("beds:view");
  const beds = await listBeds();
  const manage = can(user.role, "beds:manage");

  return (
    <main className="flex min-w-0 flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Beds</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A bed can belong to one active visit. Occupied beds are freed on discharge.
          </p>
        </div>
        {manage ? (
          <Button
            nativeButton={false}
            className="w-full sm:w-auto"
            render={<Link href="/beds/new" />}
          >
            <IconPlus />
            Add bed
          </Button>
        ) : null}
      </div>

      {beds.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No beds</EmptyTitle>
            <EmptyDescription>No beds have been added.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        WARD_TYPES.map((ward) => {
          const group = beds.filter((bed) => bed.wardType === ward);
          if (group.length === 0) return null;
          return (
            <section key={ward}>
              <h2 className="text-lg font-medium">{WARD_LABELS[ward]}</h2>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.map((bed) => (
                  <li key={bed.id}>
                    <Card className="h-full">
                      <CardHeader>
                        <CardTitle>Bed {bed.bedNumber}</CardTitle>
                        <CardDescription>
                          {bed.currentVisit ? (
                            <Link
                              href={`/visits/${bed.currentVisit.id}`}
                              className="font-medium text-foreground hover:underline"
                            >
                              {bed.currentVisit.patient.name}
                            </Link>
                          ) : (
                            "Empty"
                          )}
                        </CardDescription>
                        <CardAction>
                          <Badge
                            variant={
                              bed.status === "MAINTENANCE"
                                ? "destructive"
                                : bed.status === "OCCUPIED"
                                  ? "secondary"
                                  : "default"
                            }
                          >
                            {BED_STATUS_LABELS[bed.status]}
                          </Badge>
                        </CardAction>
                      </CardHeader>
                      {manage && bed.status !== "OCCUPIED" ? (
                        <CardFooter>
                          <BedStatusForm bedId={bed.id} status={bed.status} />
                        </CardFooter>
                      ) : null}
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}
    </main>
  );
}
