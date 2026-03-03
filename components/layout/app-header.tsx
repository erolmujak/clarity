"use client"

import { Menu, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useExpenses } from "@/lib/contexts/expense-context"
import { useProfile } from "@/lib/contexts/profile-context"
import { formatCurrency } from "@/lib/currencies"
import { useTranslation } from "@/lib/i18n"
import { ExpenseForm } from "@/components/expenses/expense-form"
import { BalanceForm } from "@/components/balances/balance-form"
import type { ActiveView } from "@/lib/types"

interface AppHeaderProps {
  onToggleSidebar: () => void
  onOpenSettings: () => void
  activeView: ActiveView
  onChangeView: (view: ActiveView) => void
}

export function AppHeader({ onToggleSidebar, onOpenSettings, activeView, onChangeView }: AppHeaderProps) {
  const { expenses, monthlyTotalInGlobal } = useExpenses()
  const { globalCurrency, displayName } = useProfile()
  const { t, lang } = useTranslation()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-5 sm:px-8">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 lg:hidden"
          onClick={onToggleSidebar}
          aria-label={t("app.open_sidebar")}
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* View tabs */}
        <nav className="flex items-center" role="tablist" aria-label="Main navigation">
          <button
            role="tab"
            aria-selected={activeView === "expenses"}
            onClick={() => onChangeView("expenses")}
            className={`relative px-1 py-1.5 text-sm transition-colors ${
              activeView === "expenses"
                ? "font-semibold text-foreground"
                : "font-medium text-muted-foreground hover:text-foreground"
            }`}
          >
            {t("app.expenses")}
            {activeView === "expenses" && (
              <span className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-foreground" />
            )}
          </button>

          <span className="mx-3 h-4 w-px bg-border" aria-hidden="true" />

          <button
            role="tab"
            aria-selected={activeView === "balances"}
            onClick={() => onChangeView("balances")}
            className={`relative px-1 py-1.5 text-sm transition-colors ${
              activeView === "balances"
                ? "font-semibold text-foreground"
                : "font-medium text-muted-foreground hover:text-foreground"
            }`}
          >
            Balances
            {activeView === "balances" && (
              <span className="absolute inset-x-0 -bottom-[1px] h-0.5 bg-foreground" />
            )}
          </button>

          {/* Contextual subtitle — only in expenses view on larger screens */}
          {activeView === "expenses" && expenses.length > 0 && (
            <span className="ml-4 hidden text-sm text-muted-foreground sm:inline">
              {expenses.length} {expenses.length !== 1 ? t("app.items_plural") : t("app.items")}
              {" \u00B7 "}
              <span className="font-mono">
                {formatCurrency(monthlyTotalInGlobal, globalCurrency, lang)}
              </span>
              {" "}{t("app.per_month")}
            </span>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        {activeView === "expenses" ? <ExpenseForm /> : <BalanceForm />}

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={onOpenSettings}
          aria-label={t("app.account_settings")}
        >
          {displayName ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground">
              {displayName.charAt(0).toUpperCase()}
            </span>
          ) : (
            <User className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  )
}
