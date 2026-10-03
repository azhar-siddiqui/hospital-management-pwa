import { CreateItemForm, ExpenseForm, StockForm } from "@/components/hospital/forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader } from "@/components/ui/empty";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requirePermission } from "@/lib/auth";
import { formatMoney, formatWhen } from "@/lib/format";
import { listExpenses, listInventory } from "@/lib/hospital";
import { can } from "@/lib/permissions";

export default async function InventoryPage() {
  const user = await requirePermission("inventory:view");
  const [items, expenses] = await Promise.all([
    listInventory(),
    can(user.role, "expenses:view") ? listExpenses() : Promise.resolve(null),
  ]);
  const manage = can(user.role, "inventory:manage");

  return (
    <main className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Inventory</h1>
        <p className="mt-1 text-sm text-muted-foreground">Stock quantities and daily expenses recorded by the signed-in user.</p>
      </div>

      {manage ? (
        <Card>
          <CardHeader>
            <CardTitle>New item</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateItemForm />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Stock</CardTitle>
        </CardHeader>
        {items.length === 0 ? (
          <CardContent>
            <Empty className="border-0">
              <EmptyHeader>
                <EmptyDescription>No items yet.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          </CardContent>
        ) : (
          <Table className="min-w-[40rem]">
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.itemName}</TableCell>
                  <TableCell>{item.category ?? "—"}</TableCell>
                  <TableCell>
                    {manage ? (
                      <span className="inline-flex items-center gap-2">
                        <StockForm itemId={item.id} quantity={item.quantity} />
                        <span className="text-muted-foreground">{item.unit}</span>
                      </span>
                    ) : (
                      <span>
                        {item.quantity} {item.unit}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatWhen(item.lastUpdated)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {can(user.role, "expenses:create") ? (
        <Card>
          <CardHeader>
            <CardTitle>Record expense</CardTitle>
            <CardDescription>
              Saved against your account. The amount cannot be edited later from this screen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseForm />
          </CardContent>
        </Card>
      ) : null}

      {expenses ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Recent expenses</CardTitle>
          </CardHeader>
          {expenses.length === 0 ? (
            <CardContent>
              <Empty className="border-0">
                <EmptyHeader>
                  <EmptyDescription>No expenses recorded.</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          ) : (
            <Table className="min-w-[36rem]">
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>By</TableHead>
                  <TableHead>When</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.description}</TableCell>
                    <TableCell>{formatMoney(expense.amount)}</TableCell>
                    <TableCell>{expense.loggedBy.name}</TableCell>
                    <TableCell className="text-muted-foreground">{formatWhen(expense.expenseDate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      ) : null}
    </main>
  );
}
