import { CreateUserForm } from "@/components/staff/create-user-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roleLabel } from "@/lib/roles";
import { isSeededAdmin } from "@/lib/users";

export default async function StaffPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Staff</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          The admin account is seeded from <code className="text-foreground">ADMIN_EMAIL</code> and{" "}
          <code className="text-foreground">ADMIN_PASSWORD</code>. Use this page to create every other role.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New account</CardTitle>
        </CardHeader>
        <CardContent>
          <CreateUserForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>People</CardTitle>
        </CardHeader>
        <Table className="min-w-[36rem]">
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Added</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {roleLabel(user.role)}
                  {isSeededAdmin(user.email) ? (
                    <Badge variant="secondary" className="ml-2">
                      From .env
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="text-muted-foreground">{user.createdAt.toLocaleDateString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}
