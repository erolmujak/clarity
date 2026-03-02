"use client"

import type { Expense } from "@/lib/types"
import { formatCurrency, getCurrencyByCode } from "@/lib/currencies"
import { useExpenses } from "@/lib/expense-context"
import { useTranslation } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n"

const FREQ_KEYS: Record<string, TranslationKey> = {
  weekly: "freq.weekly",
  monthly: "freq.monthly",
  yearly: "freq.yearly",
}

const MONTH_SHORT_KEYS: TranslationKey[] = [
  "month_short.jan", "month_short.feb", "month_short.mar", "month_short.apr",
  "month_short.may", "month_short.jun", "month_short.jul", "month_short.aug",
  "month_short.sep", "month_short.oct", "month_short.nov", "month_short.dec",
]

interface ExpenseItemProps {
  expense: Expense
  onEdit: (expense: Expense) => void
}

export function ExpenseItem({ expense, onEdit }: ExpenseItemProps) {
  const { getMonthlyAmountInGlobal, globalCurrency } = useExpenses()
  const { t, lang } = useTranslation()

  const currency = getCurrencyByCode(expense.currency)
  const monthlyInGlobal = getMonthlyAmountInGlobal(expense)
  const showConverted = expense.currency !== globalCurrency || expense.frequency !== "monthly"
  const daysUntilRenewal = getNextOccurrenceDays(expense)

  return (
    <button
      onClick={() => onEdit(expense)}
      className="group w-full text-left transition-colors hover:bg-muted/50 py-4 px-0 rounded-md cursor-pointer flex items-center justify-between"
      aria-label={`Edit ${expense.name}`}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-sm font-medium text-foreground">{expense.name}</span>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span>
            {daysUntilRenewal === 0 && "Renews today"}
            {daysUntilRenewal === 1 && "Renews tomorrow"}
            {daysUntilRenewal > 1 && `Renews in ${daysUntilRenewal} days`}
          </span>
          <span className="text-border">{"•"}</span>
          <span>{currency?.code ?? expense.currency}</span>
        </div>
        {expense.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {expense.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0 ml-4">
        <div className="flex flex-col items-end gap-0.5">
          <span className="font-mono text-sm font-medium text-foreground">
            {formatCurrency(expense.amount, expense.currency, lang)}
          </span>
          {showConverted && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {formatCurrency(monthlyInGlobal, globalCurrency, lang)}{" "}{t("app.per_month")}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function getNextOccurrenceDays(expense: Expense): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let nextOccurrence: Date

  if (expense.frequency === "monthly" && expense.dayOfMonth) {
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    nextOccurrence = new Date(currentYear, currentMonth, expense.dayOfMonth)

    if (nextOccurrence <= today) {
      nextOccurrence.setMonth(currentMonth + 1)
    }
  } else if (
    expense.frequency === "yearly" &&
    expense.yearlyMonth != null &&
    expense.yearlyDay != null
  ) {
    const currentYear = today.getFullYear()
    nextOccurrence = new Date(currentYear, expense.yearlyMonth, expense.yearlyDay)

    if (nextOccurrence <= today) {
      nextOccurrence.setFullYear(currentYear + 1)
    }
  } else if (expense.frequency === "weekly") {
    nextOccurrence = new Date(today)
    nextOccurrence.setDate(today.getDate() + 7)
  } else {
    return 0
  }

  const daysUntil = Math.floor(
    (nextOccurrence.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  )
  return daysUntil
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
