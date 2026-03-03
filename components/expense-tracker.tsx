"use client"

import { useState } from "react"
import { ProfileProvider, useProfile } from "@/lib/contexts/profile-context"
import { RatesProvider } from "@/lib/contexts/rates-context"
import { ExpenseProvider, useExpenses } from "@/lib/contexts/expense-context"
import { BalanceProvider } from "@/lib/contexts/balance-context"
import { formatCurrency } from "@/lib/currencies"
import { useTranslation } from "@/lib/i18n"
import type { ActiveView } from "@/lib/types"
import { ExpensesSidebar } from "./expenses/expenses-sidebar"
import { ExpenseList } from "./expenses/expense-list"
import { BalanceList } from "./balances/balance-list"
import { AppHeader } from "./layout/app-header"
import { MobileSidebarSheet } from "./layout/mobile-sidebar-sheet"
import { ProfileSettings } from "./settings/profile-settings"

export function ExpenseTracker() {
  return (
    <ProfileProvider>
      <RatesProvider>
        <ExpenseProvider>
          <BalanceProvider>
            <ExpenseTrackerInner />
          </BalanceProvider>
        </ExpenseProvider>
      </RatesProvider>
    </ProfileProvider>
  )
}

function ExpenseTrackerInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeView, setActiveView] = useState<ActiveView>("expenses")
  const [sidebarWidth, setSidebarWidth] = useState(320)
  const [isResizing, setIsResizing] = useState(false)
  const { loading } = useProfile()
  const { t } = useTranslation()

  const handleResizeStart = () => {
    setIsResizing(true)
  }

  const handleResizeEnd = () => {
    setIsResizing(false)
  }

  const handleResizeMove = (e: React.MouseEvent) => {
    if (!isResizing) return
    const newWidth = Math.max(240, Math.min(600, window.innerWidth - e.clientX))
    setSidebarWidth(newWidth)
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
          <p className="text-sm text-muted-foreground">{t("app.loading")}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {activeView === "settings" ? (
        <ProfileSettings onClose={() => setActiveView("expenses")} />
      ) : (
        <div
          className="flex h-screen overflow-hidden bg-background"
          onMouseMove={handleResizeMove}
          onMouseUp={handleResizeEnd}
          onMouseLeave={handleResizeEnd}
        >
          <div className="flex flex-1 flex-col overflow-hidden">
            <AppHeader
              onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              onOpenSettings={() => setActiveView("settings")}
              activeView={activeView}
              onChangeView={setActiveView}
            />

            <main className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-2xl px-5 py-8 sm:px-8 lg:py-12">
                {activeView === "expenses" ? (
                  <>
                    <MobileStats />
                    <ExpenseList />
                  </>
                ) : (
                  <BalanceList />
                )}
              </div>
            </main>
          </div>

          <MobileSidebarSheet open={sidebarOpen} onOpenChange={setSidebarOpen} />

          <div
            className="hidden shrink-0 lg:flex flex-col border-l border-border relative"
            style={{ width: `${sidebarWidth}px` }}
          >
            <ExpensesSidebar />
            <div
              onMouseDown={handleResizeStart}
              className={`absolute -left-1 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50 transition-colors ${
                isResizing ? "bg-primary/50" : ""
              }`}
              style={{ left: "-4px" }}
            />
          </div>
        </div>
      )}
    </>
  )
}

function MobileStats() {
  const { expenses, monthlyTotalInGlobal } = useExpenses()
  const { globalCurrency } = useProfile()
  const { t, lang } = useTranslation()

  if (!expenses || expenses.length === 0) return null

  return (
    <div className="mb-10 rounded-xl border border-border bg-card p-5 lg:hidden">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{t("sidebar.monthly_total")}</p>
      <p className="mt-2 font-mono text-2xl font-semibold text-foreground">
        {formatCurrency(monthlyTotalInGlobal, globalCurrency, lang)}
      </p>
      <div className="mt-4 flex gap-8">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("sidebar.weekly")}</p>
          <p className="mt-0.5 font-mono text-sm text-foreground">
            {formatCurrency(monthlyTotalInGlobal / 4.333, globalCurrency, lang)}
          </p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t("sidebar.yearly")}</p>
          <p className="mt-0.5 font-mono text-sm text-foreground">
            {formatCurrency(monthlyTotalInGlobal * 12, globalCurrency, lang)}
          </p>
        </div>
      </div>
    </div>
  )
}
