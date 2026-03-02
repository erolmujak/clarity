"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ExpenseTracker } from "@/components/expense-tracker"

export default function Page() {
  const router = useRouter()
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth/login")
        return
      }

      setIsAuthed(true)
    }

    checkAuth()
  }, [router])

  // Don't render anything until we know they're authenticated
  if (isAuthed !== true) {
    return null
  }

  return <ExpenseTracker />
}
