export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <div className="h-4 w-24 rounded bg-muted" />
      <div className="h-8 w-56 max-w-full rounded-lg bg-muted" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-14 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-28 rounded-2xl bg-muted" />
        ))}
      </div>
      <div className="h-36 rounded-2xl bg-muted" />
    </div>
  );
}
