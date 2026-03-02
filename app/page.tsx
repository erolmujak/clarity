"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ExpenseTracker } from "@/components/expense-tracker"

export default function Page() {
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  return <ExpenseTracker />
}
