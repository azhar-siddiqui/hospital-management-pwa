import { CreateUserForm } from "@/components/staff/create-user-form";
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

      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-lg font-medium">New account</h2>
        <div className="mt-4">
          <CreateUserForm />
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-lg font-medium">People</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-muted-foreground">
              <tr>
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Email</th>
                <th className="px-5 py-2 font-medium">Role</th>
                <th className="px-5 py-2 font-medium">Added</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border">
                  <td className="px-5 py-3 font-medium">{user.name}</td>
                  <td className="px-5 py-3">{user.email}</td>
                  <td className="px-5 py-3">
                    {roleLabel(user.role)}
                    {isSeededAdmin(user.email) ? (
                      <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        From .env
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {user.createdAt.toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
