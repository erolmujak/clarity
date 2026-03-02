import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ExpenseTracker } from "@/components/expense-tracker"

export default async function Page() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error("[Auth Check] Error getting user:", error)
      redirect("/auth/login")
    }

    if (!user) {
      console.log("[Auth Check] No user found, redirecting to login")
      redirect("/auth/login")
    }

    console.log("[Auth Check] User authenticated:", user.id)
    return <ExpenseTracker />
  } catch (err) {
    console.error("[Auth Check] Unexpected error:", err)
    redirect("/auth/login")
  }
}
