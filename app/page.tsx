import { createClient } from "@/lib/supabase/server"
import { ExpenseTracker } from "@/components/expense-tracker"
import { redirect } from "next/navigation"

// Force dynamic rendering - must be rendered on each request
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Page() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.getUser()

    console.log('[PAGE AUTH] getUser result:', {
      hasUser: !!data?.user,
      userId: data?.user?.id,
      error: error?.message
    })

    if (error) {
      console.error('[PAGE AUTH] Error:', error)
      redirect("/auth/login")
    }

    if (!data?.user) {
      console.log('[PAGE AUTH] No user detected, redirecting to login')
      redirect("/auth/login")
    }

    console.log('[PAGE AUTH] User authenticated, rendering app')
    return <ExpenseTracker />
  } catch (err) {
    console.error('[PAGE AUTH] Exception caught:', err)
    redirect("/auth/login")
  }
}
