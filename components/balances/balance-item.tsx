"use client"

import { formatCurrency, getCurrencyByCode } from "@/lib/currencies"
import type { Balance } from "@/lib/types"
import { useBalances } from "@/lib/contexts/balance-context"
import { useProfile } from "@/lib/contexts/profile-context"
import { useTranslation } from "@/lib/i18n"

interface BalanceItemProps {
  balance: Balance
  onEdit: (balance: Balance) => void
}

export function BalanceItem({ balance, onEdit }: BalanceItemProps) {
  const { getAmountInGlobal } = useBalances()
  const { globalCurrency } = useProfile()
  const { lang } = useTranslation()

  const currency = getCurrencyByCode(balance.currency)
  const amountInGlobal = getAmountInGlobal(balance)
  const showConverted = balance.currency !== globalCurrency

  return (
    <button
      onClick={() => onEdit(balance)}
      className="group w-full text-left transition-colors hover:bg-muted/50 py-4 px-0 rounded-md cursor-pointer flex items-center justify-between"
      aria-label={`Edit ${balance.name}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium text-foreground">{balance.name}</span>
        <span className="text-xs text-muted-foreground">
          {currency?.name ?? balance.currency}
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-sm font-medium text-foreground">
            {formatCurrency(balance.amount, balance.currency, lang)}
          </span>
          {showConverted && (
            <span className="font-mono text-[11px] text-muted-foreground">
              ≈ {formatCurrency(amountInGlobal, globalCurrency, lang)}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
