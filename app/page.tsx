import { ExpenseTracker } from "@/components/expense-tracker"
import { AuthGuard } from "@/components/auth/auth-guard"

export default function Page() {
  return (
    <AuthGuard>
      <ExpenseTracker />
    </AuthGuard>
  )
}
