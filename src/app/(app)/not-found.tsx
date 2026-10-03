import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Not found</CardTitle>
        <CardDescription>That record is not in the hospital.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button nativeButton={false} variant="link" className="px-0" render={<Link href="/" />}>
          Back to the dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
