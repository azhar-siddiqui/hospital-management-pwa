"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Something went wrong</CardTitle>
        <CardDescription>
          This page could not be loaded. Try again, and contact support if it keeps happening.
          {error.digest ? ` Reference ${error.digest}.` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" onClick={() => retry()}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}
