"use client"

import { formatCurrency, getCurrencyByCode } from "@/lib/currencies"
import type { Frequency } from "@/lib/types"
import { useExpenses } from "@/lib/contexts/expense-context"
import { useProfile } from "@/lib/contexts/profile-context"
import { getLanguageByCode } from "@/lib/languages"
import { useTranslation } from "@/lib/i18n"
import { useMemo } from "react"

const FREQ_KEYS: Record<Frequency, "freq.weekly" | "freq.monthly" | "freq.yearly"> = {
  weekly: "freq.weekly",
  monthly: "freq.monthly",
  yearly: "freq.yearly",
}

export function ExpensesSidebar() {
  const { expenses, monthlyTotalInGlobal, getMonthlyAmountInGlobal, allTags } = useExpenses()
  const { globalCurrency, preferredLanguage } = useProfile()
  const { t, lang } = useTranslation()

  const langInfo = getLanguageByCode(preferredLanguage)
  const currencyInfo = getCurrencyByCode(globalCurrency)

  const weeklyTotal = monthlyTotalInGlobal / 4.333
  const yearlyTotal = monthlyTotalInGlobal * 12

  const byFrequency = useMemo(() => {
    const groups: Record<Frequency, { count: number; total: number }> = {
      weekly: { count: 0, total: 0 },
      monthly: { count: 0, total: 0 },
      yearly: { count: 0, total: 0 },
    }
    for (const e of expenses) {
      groups[e.frequency].count++
      groups[e.frequency].total += getMonthlyAmountInGlobal(e)
    }
    return groups
  }, [expenses, getMonthlyAmountInGlobal])

  const byTag = useMemo(() => {
    const tagMap: Record<string, { count: number; total: number }> = {}
    for (const e of expenses) {
      for (const tag of e.tags) {
        if (!tagMap[tag]) tagMap[tag] = { count: 0, total: 0 }
        tagMap[tag].count++
        tagMap[tag].total += getMonthlyAmountInGlobal(e)
      }
    }
    return Object.entries(tagMap)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 8)
  }, [expenses, getMonthlyAmountInGlobal])


  return (
    <aside className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* Brand */}
      <div className="flex h-14 items-center px-6">
        <span className="text-sm font-semibold tracking-tight text-sidebar-primary">
          {t("app.name")}
        </span>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">

        {/* ── Monthly expenses total ─────────────────── */}
        <div className="px-6 py-6">
          <p className="text-[11px] uppercase tracking-widest text-sidebar-muted">
            {t("sidebar.monthly_total")}
          </p>
          <p className="mt-3 font-mono text-3xl font-light tracking-tight text-sidebar-primary">
            {formatCurrency(monthlyTotalInGlobal, globalCurrency, lang)}
          </p>
          <div className="mt-5 flex gap-8">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-sidebar-muted">{t("sidebar.weekly")}</p>
              <p className="mt-1 font-mono text-sm text-sidebar-foreground">
                {formatCurrency(weeklyTotal, globalCurrency, lang)}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-widest text-sidebar-muted">{t("sidebar.yearly")}</p>
              <p className="mt-1 font-mono text-sm text-sidebar-foreground">
                {formatCurrency(yearlyTotal, globalCurrency, lang)}
              </p>
            </div>
          </div>
        </div>

        <div className="mx-6 border-t border-sidebar-border" />

        {/* By frequency */}
        {expenses.length > 0 && (
          <>
            <div className="mx-6 border-t border-sidebar-border" />
            <div className="px-6 py-6">
              <p className="text-[11px] uppercase tracking-widest text-sidebar-muted">
                {t("sidebar.by_frequency")}
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {(["weekly", "monthly", "yearly"] as Frequency[]).map((freq) => {
                  const data = byFrequency[freq]
                  if (data.count === 0) return null
                  return (
                    <div key={freq} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-sidebar-foreground">
                          {t(FREQ_KEYS[freq])}
                        </span>
                        <span className="text-[10px] text-sidebar-muted">
                          {data.count}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-sidebar-foreground">
                        {formatCurrency(data.total, globalCurrency, lang)}{" "}{t("app.per_month")}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* By tag */}
        {byTag.length > 0 && (
          <>
            <div className="mx-6 border-t border-sidebar-border" />
            <div className="px-6 py-6">
              <p className="text-[11px] uppercase tracking-widest text-sidebar-muted">
                {t("sidebar.by_tag")}
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {byTag.map(([tag, data]) => (
                  <div key={tag} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="inline-flex items-center truncate rounded-full bg-sidebar-accent px-2 py-0.5 text-[10px] font-medium text-sidebar-foreground">
                        {tag}
                      </span>
                      <span className="text-[10px] text-sidebar-muted">
                        {data.count}
                      </span>
                    </div>
                    <span className="shrink-0 font-mono text-xs text-sidebar-foreground">
                      {formatCurrency(data.total, globalCurrency, lang)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

      </div>

      {/* Preferences summary */}
      <div className="border-t border-sidebar-border px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-widest text-sidebar-muted">{t("sidebar.lang")}</span>
            <span className="text-xs text-sidebar-foreground">{langInfo?.name ?? preferredLanguage}</span>
          </div>
          <div className="h-3 w-px bg-sidebar-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase tracking-widest text-sidebar-muted">{t("sidebar.curr")}</span>
            <span className="text-xs text-sidebar-foreground">
              {currencyInfo ? `${currencyInfo.symbol} ${currencyInfo.code}` : globalCurrency}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
