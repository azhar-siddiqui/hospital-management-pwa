import { CreateItemForm, ExpenseForm, StockForm } from "@/components/hospital/forms";
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
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-medium">New item</h2>
          <div className="mt-4">
            <CreateItemForm />
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <h2 className="border-b border-border px-5 py-3 font-medium">Stock</h2>
        {items.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">No items yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="px-5 py-2 font-medium">Item</th>
                  <th className="px-5 py-2 font-medium">Category</th>
                  <th className="px-5 py-2 font-medium">Quantity</th>
                  <th className="px-5 py-2 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-5 py-3 font-medium">{item.itemName}</td>
                    <td className="px-5 py-3">{item.category ?? "—"}</td>
                    <td className="px-5 py-3">
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
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{formatWhen(item.lastUpdated)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {can(user.role, "expenses:create") ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-medium">Record expense</h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">Saved against your account. The amount cannot be edited later from this screen.</p>
          <ExpenseForm />
        </section>
      ) : null}

      {expenses ? (
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <h2 className="border-b border-border px-5 py-3 font-medium">Recent expenses</h2>
          {expenses.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted-foreground">No expenses recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-sm">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="px-5 py-2 font-medium">Description</th>
                    <th className="px-5 py-2 font-medium">Amount</th>
                    <th className="px-5 py-2 font-medium">By</th>
                    <th className="px-5 py-2 font-medium">When</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-t border-border">
                      <td className="px-5 py-3">{expense.description}</td>
                      <td className="px-5 py-3">{formatMoney(expense.amount)}</td>
                      <td className="px-5 py-3">{expense.loggedBy.name}</td>
                      <td className="px-5 py-3 text-muted-foreground">{formatWhen(expense.expenseDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </main>
  );
}
