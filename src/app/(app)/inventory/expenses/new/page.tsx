import { redirect } from "next/navigation";

export default function LegacyNewExpensePage() {
  redirect("/expenses/new");
}
