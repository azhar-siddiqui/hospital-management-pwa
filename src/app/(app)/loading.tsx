export default function Loading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-live="polite">
      <div>
        <div className="h-3 w-20 rounded bg-muted" />
        <div className="mt-2 h-8 w-56 max-w-full rounded-lg bg-muted" />
        <div className="mt-2 h-4 w-48 max-w-full rounded bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-[5.5rem] rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card sm:grid sm:grid-cols-2 sm:gap-3 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-24 border-b border-border bg-muted/50 last:border-b-0 sm:h-32 sm:rounded-2xl sm:border sm:bg-muted"
          />
        ))}
      </div>
      <div className="h-48 rounded-2xl bg-muted" />
    </div>
  );
}
