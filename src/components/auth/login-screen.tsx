import { LoginForm } from "@/components/auth/login-form";
import { ThemeToggle } from "@/components/theme-toggle";
import { IconPlus } from "@tabler/icons-react";
import { cn } from "cn";

export function LoginScreen({ nextPath }: { nextPath?: string }) {
  return (
    <main className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="relative hidden w-full shrink-0 flex-col justify-between overflow-hidden bg-primary px-10 py-12 text-primary-foreground lg:flex lg:min-h-dvh lg:w-1/2 lg:max-w-3xl xl:px-14">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 -left-16 size-72 rounded-full bg-primary-foreground/15" />
          <div className="absolute right-0 bottom-0 size-96 translate-x-1/3 translate-y-1/3 rounded-full bg-primary-foreground/10" />
        </div>
        <BrandMark className="relative" tone="inverse" />
        <div className="relative max-w-md">
          <p className="text-4xl leading-[1.15] font-semibold tracking-tight text-balance xl:text-5xl">
            One workspace for the people on duty.
          </p>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-pretty text-primary-foreground/80">
            Ward status, staff access, and the rest of the day’s work. Sign in with the account an
            administrator created for you.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/75">Staff access only</p>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-background">
        <div className="flex items-start gap-3 ps-[max(1rem,env(safe-area-inset-left))] pe-[max(0.75rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))]">
          <BrandMark className="pt-1 lg:hidden" />
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-center ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))] pt-6 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <div className="mx-auto w-full max-w-sm">
            <LoginForm nextPath={nextPath} />
            <p className="mt-6 text-center text-xs leading-relaxed text-balance text-muted-foreground">
              There is no public signup. Ask an administrator if you need an account.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function BrandMark({
  className,
  tone = "default",
}: {
  className?: string;
  tone?: "default" | "inverse";
}) {
  const inverse = tone === "inverse";
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span
        className={
          inverse
            ? "grid size-10 shrink-0 place-items-center rounded-lg bg-primary-foreground text-primary shadow-sm"
            : "grid size-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm"
        }
        aria-hidden
      >
        <IconPlus className="size-5" stroke={2.25} />
      </span>
      <span className="min-w-0">
        <span
          className={
            inverse
              ? "block truncate text-sm font-semibold tracking-tight"
              : "block truncate text-sm font-semibold tracking-tight text-foreground"
          }
        >
          Hospital
        </span>
        <span
          className={
            inverse
              ? "block truncate text-[11px] font-medium tracking-widest text-primary-foreground/70 uppercase"
              : "block truncate text-[11px] font-medium tracking-widest text-muted-foreground uppercase"
          }
        >
          Operations
        </span>
      </span>
    </div>
  );
}
