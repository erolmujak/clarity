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
      try {
        const supabase = createClient()
        const { data: { user }, error } = await supabase.auth.getUser()

        if (error || !user) {
          router.push("/auth/login")
          return
        }

        setIsAuthed(true)
      } catch {
        router.push("/auth/login")
      }
    }

    checkAuth()
  }, [router])

  // Don't render anything until we know they're authenticated
  if (isAuthed !== true) {
    return null
  }

  return <ExpenseTracker />
}
