"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        This page could not be loaded. Try again, and contact support if it keeps happening.
        {error.digest ? ` Reference ${error.digest}.` : ""}
      </p>
      <Button type="button" className="mt-4" onClick={() => retry()}>
        Try again
      </Button>
    </div>
  );
}
