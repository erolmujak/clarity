"use client"

import { useState } from "react"
import { Wallet } from "lucide-react"
import { formatCurrency } from "@/lib/currencies"
import { useBalances } from "@/lib/balance-context"
import { useExpenses } from "@/lib/expense-context"
import { useTranslation } from "@/lib/i18n"
import type { Balance } from "@/lib/types"
import { BalanceItem } from "./balance-item"
import { BalanceForm } from "./balance-form"

export function BalanceList() {
  const { balances, totalInGlobal } = useBalances()
  const { globalCurrency } = useExpenses()
  const { lang } = useTranslation()
  const [editingBalance, setEditingBalance] = useState<Balance | null>(null)

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Accounts</h2>
          {balances.length > 0 && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {balances.length} {balances.length === 1 ? "account" : "accounts"}
            </p>
          )}
        </div>
        <BalanceForm />
      </div>

      {/* Net balance summary */}
      {balances.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Net Balance
          </p>
          <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
            {formatCurrency(totalInGlobal, globalCurrency, lang)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Across all accounts · converted to {globalCurrency}
          </p>
        </div>
      )}

      {/* Empty state */}
      {balances.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">No accounts yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add a cash wallet, checking account, savings, or any custom account.
            </p>
          </div>
          <BalanceForm />
        </div>
      ) : (
        /* Account list */
        <div className="rounded-xl border border-border bg-card">
          <div className="divide-y divide-border px-5">
            {balances.map((balance) => (
              <BalanceItem
                key={balance.id}
                balance={balance}
                onEdit={setEditingBalance}
              />
            ))}
          </div>
        </div>
      )}

      {/* Edit dialog (rendered outside the list to avoid nesting issues) */}
      {editingBalance && (
        <BalanceForm
          editingBalance={editingBalance}
          triggerButton={false}
          onClose={() => setEditingBalance(null)}
        />
      )}
    </div>
  )
}
