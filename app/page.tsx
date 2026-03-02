import { createClient } from "@/lib/supabase/server"
import { ExpenseTracker } from "@/components/expense-tracker"
import { redirect } from "next/navigation"

// Force dynamic rendering - must be rendered on each request
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // If no user, redirect to login
  if (!user) {
    redirect("/auth/login")
  }

  // User is authenticated, render the app
  return <ExpenseTracker />
}
