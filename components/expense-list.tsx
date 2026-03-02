"use client"

import { useState, useMemo } from "react"
import { Search, X, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Expense } from "@/lib/types"
import { useExpenses } from "@/lib/expense-context"
import { useTranslation } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n"
import { ExpenseItem } from "./expense-item"
import { ExpenseForm } from "./expense-form"

type SortField = "name" | "amount" | "date" | "frequency"
type SortDir = "asc" | "desc"

const FREQUENCY_ORDER: Record<string, number> = { weekly: 0, monthly: 1, yearly: 2 }

const SORT_LABEL_KEYS: Record<SortField, TranslationKey> = {
  name: "sort.name",
  amount: "sort.amount",
  date: "sort.date",
  frequency: "sort.frequency",
}

export function ExpenseList() {
  const { expenses, allTags, getMonthlyAmountInGlobal } = useExpenses()
  const { t } = useTranslation()

  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [search, setSearch] = useState("")
  const [activeTags, setActiveTags] = useState<string[]>([])
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  function toggleTag(tag: string) {
    setActiveTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  const filtered = useMemo(() => {
    let result = expenses

    // Text search
    const q = search.trim().toLowerCase()
    if (q) {
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    }

    // Tag filter
    if (activeTags.length > 0) {
      result = result.filter((e) =>
        activeTags.every((tag) => e.tags.includes(tag))
      )
    }

    // Sort
    const dir = sortDir === "asc" ? 1 : -1
    result = [...result].sort((a, b) => {
      switch (sortField) {
        case "name":
          return dir * a.name.localeCompare(b.name)
        case "amount":
          return dir * (getMonthlyAmountInGlobal(a) - getMonthlyAmountInGlobal(b))
        case "date":
          return dir * (new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime())
        case "frequency":
          return dir * ((FREQUENCY_ORDER[a.frequency] ?? 0) - (FREQUENCY_ORDER[b.frequency] ?? 0))
        default:
          return 0
      }
    })

    return result
  }, [expenses, search, activeTags, sortField, sortDir, getMonthlyAmountInGlobal])

  if (expenses.length === 0) {
    return (
      <div className="flex flex-col items-center py-24 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="text-muted-foreground">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <p className="text-sm font-medium text-foreground">{t("list.no_expenses")}</p>
        <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">
          {t("list.add_first")}
        </p>
      </div>
    )
  }

  return (
    <>
      {/* Search + Sort bar */}
      <div className="mb-4 flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("search.placeholder")}
            className="h-9 bg-card pl-9 pr-8 text-sm"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label={t("search.clear")}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-1.5 bg-transparent text-xs">
              <ArrowUpDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t(SORT_LABEL_KEYS[sortField])}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuRadioGroup
              value={`${sortField}-${sortDir}`}
              onValueChange={(v) => {
                const [field, dir] = v.split("-") as [SortField, SortDir]
                setSortField(field)
                setSortDir(dir)
              }}
            >
              <DropdownMenuRadioItem value="date-desc">{t("sort.date")} ↓</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date-asc">{t("sort.date")} ↑</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="amount-desc">{t("sort.amount")} ↓</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="amount-asc">{t("sort.amount")} ↑</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name-asc">{t("sort.name")} A→Z</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="name-desc">{t("sort.name")} Z→A</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="frequency-asc">{t("sort.frequency")} ↑</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="frequency-desc">{t("sort.frequency")} ↓</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {allTags.map((tag) => {
            const active = activeTags.includes(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium transition-colors ${
                  active
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {tag}
                {active && <X className="ml-1 h-2.5 w-2.5" />}
              </button>
            )
          })}
          {activeTags.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTags([])}
              className="inline-flex h-6 items-center rounded-full px-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              {t("search.clear_filters")}
            </button>
          )}
        </div>
      )}

      {/* Results count when filtering */}
      {(search || activeTags.length > 0) && (
        <p className="mb-3 text-xs text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? t("app.items") : t("app.items_plural")}
          {activeTags.length > 0 && ` · ${activeTags.join(", ")}`}
        </p>
      )}

      {/* Expense items */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("search.no_results")}</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-border">
          {filtered.map((expense) => (
            <ExpenseItem
              key={expense.id}
              expense={expense}
              onEdit={setEditingExpense}
            />
          ))}
        </div>
      )}

      {editingExpense && (
        <ExpenseForm
          editingExpense={editingExpense}
          onClose={() => setEditingExpense(null)}
          triggerButton={false}
        />
      )}
    </>
  )
}
