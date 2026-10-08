import { Skeleton } from "@/components/ui/skeleton";
import { PERMISSION_GROUPS } from "@/lib/permissions";

function TextBar({ text, className }: { text: string; className: string }) {
  return (
    <span className="relative block w-fit max-w-full">
      <span className={`invisible block ${className}`} aria-hidden>
        {text}
      </span>
      <Skeleton className="absolute inset-0" />
    </span>
  );
}

export function StaffPermissionPageSkeleton() {
  return (
    <main className="flex min-w-0 flex-col gap-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading permissions</span>
      <div className="min-w-0">
        <span className="relative inline-block max-w-full">
          <span
            className="invisible block text-2xl font-semibold tracking-tight sm:text-3xl"
            aria-hidden
          >
            Permissions
          </span>
          <Skeleton className="absolute inset-0" />
        </span>
        <div className="mt-1 max-w-2xl">
          <TextBar text="Choose every area this account can use." className="text-sm" />
        </div>
        <div className="mt-1 max-w-2xl">
          <TextBar
            text="Manage staff is the only permission that opens a screen today. Every other choice is saved on this account."
            className="text-sm"
          />
        </div>
        <div className="mt-2">
          <TextBar text="Receptionist" className="text-sm font-medium" />
        </div>
      </div>
      <div className="flex w-full max-w-2xl min-w-0 flex-col gap-6">
        {PERMISSION_GROUPS.map((group) => (
          <div
            key={group.label}
            className="flex flex-col gap-2 border-b border-border pb-6 last:border-b-0 last:pb-0"
          >
            <div>
              <TextBar text={group.label} className="text-sm font-medium" />
              <TextBar text={group.description} className="text-xs" />
            </div>
            {group.items.map((item) => (
              <div key={item.permission} className="flex items-start gap-2">
                <Skeleton className="mt-0.5 size-4 shrink-0 rounded-[4px]" />
                <span className="min-w-0 flex-1">
                  <TextBar text={item.label} className="text-sm font-medium" />
                  <TextBar text={item.detail} className="text-xs" />
                </span>
              </div>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <span className="relative inline-flex">
            <span
              className="invisible inline-flex h-8 items-center px-2.5 text-sm font-medium"
              aria-hidden
            >
              Save
            </span>
            <Skeleton className="absolute inset-0 rounded-lg" />
          </span>
          <span className="relative inline-flex">
            <span
              className="invisible inline-flex h-8 items-center px-2.5 text-sm font-medium"
              aria-hidden
            >
              Cancel
            </span>
            <Skeleton className="absolute inset-0 rounded-lg" />
          </span>
        </div>
      </div>
    </main>
  );
}
