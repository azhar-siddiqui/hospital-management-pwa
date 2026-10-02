import { cn } from "@/lib/utils";

export const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function Field({
  label,
  name,
  error,
  className,
  ...props
}: {
  label: string;
  name: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = props.id ?? name;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input id={id} name={name} className={fieldClass} {...props} />
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function SelectField({
  label,
  name,
  error,
  children,
  defaultValue,
  id,
}: {
  label: string;
  name: string;
  error?: string;
  children: React.ReactNode;
  defaultValue?: string;
  id?: string;
}) {
  const fieldId = id ?? name;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium">
        {label}
      </label>
      <select id={fieldId} name={name} defaultValue={defaultValue} className={fieldClass}>
        {children}
      </select>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}

export function FormMessage({ message, ok }: { message?: string; ok?: boolean }) {
  if (!message) return null;
  return (
    <p className={ok ? "text-sm" : "text-sm text-destructive"} role={ok ? "status" : "alert"}>
      {message}
    </p>
  );
}
