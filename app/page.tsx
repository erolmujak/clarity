import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ExpenseTracker } from "@/components/expense-tracker"

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return <ExpenseTracker />
}
