"use client"

import { useState, useEffect } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog"
import { CURRENCIES } from "@/lib/currencies"
import type { Expense, ExpenseFormData, Frequency } from "@/lib/types"
import { useExpenses } from "@/lib/expense-context"
import { useTranslation } from "@/lib/i18n"
import type { TranslationKey } from "@/lib/i18n"
import { TagInput } from "@/components/tag-input"

const FREQUENCY_OPTIONS: { value: Frequency; key: TranslationKey }[] = [
  { value: "weekly", key: "freq.weekly" },
  { value: "monthly", key: "freq.monthly" },
  { value: "yearly", key: "freq.yearly" },
]

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const MONTH_KEYS: TranslationKey[] = [
  "month.jan", "month.feb", "month.mar", "month.apr", "month.may", "month.jun",
  "month.jul", "month.aug", "month.sep", "month.oct", "month.nov", "month.dec",
]

function getDaysInMonth(month: number): number {
  const year = new Date().getFullYear()
  return new Date(year, month + 1, 0).getDate()
}

interface ExpenseFormProps {
  editingExpense?: Expense | null
  onClose?: () => void
  triggerButton?: boolean
}

export function ExpenseForm({ editingExpense, onClose, triggerButton = true }: ExpenseFormProps) {
  const { addExpense, updateExpense, removeExpense, globalCurrency } = useExpenses()
  const { t } = useTranslation()
  const [open, setOpen] = useState(!triggerButton)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [frequency, setFrequency] = useState<Frequency>("monthly")
  const [currency, setCurrency] = useState(globalCurrency)
  const [dayOfMonth, setDayOfMonth] = useState(1)
  const [yearlyMonth, setYearlyMonth] = useState(0)
  const [yearlyDay, setYearlyDay] = useState(1)
  const [tags, setTags] = useState<string[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (editingExpense) {
      setName(editingExpense.name)
      setAmount(editingExpense.amount.toString())
      setFrequency(editingExpense.frequency)
      setCurrency(editingExpense.currency)
      setDayOfMonth(editingExpense.dayOfMonth ?? 1)
      setYearlyMonth(editingExpense.yearlyMonth ?? 0)
      setYearlyDay(editingExpense.yearlyDay ?? 1)
      setTags(editingExpense.tags ?? [])
      setOpen(true)
    }
  }, [editingExpense])

  useEffect(() => {
    if (!editingExpense) {
      setCurrency(globalCurrency)
    }
  }, [globalCurrency, editingExpense])

  // Clamp yearlyDay when month changes
  useEffect(() => {
    const maxDays = getDaysInMonth(yearlyMonth)
    if (yearlyDay > maxDays) {
      setYearlyDay(maxDays)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yearlyMonth])

  function resetForm() {
    setName("")
    setAmount("")
    setFrequency("monthly")
    setCurrency(globalCurrency)
    setDayOfMonth(1)
    setYearlyMonth(0)
    setYearlyDay(1)
    setTags([])
    setErrors({})
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = t("form.required")
    if (!amount || Number.isNaN(Number(amount)) || Number(amount) <= 0) {
      newErrors.amount = t("form.valid_amount")
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return

    const data: ExpenseFormData = {
      name: name.trim(),
      amount,
      frequency,
      currency,
      dayOfMonth: frequency === "monthly" ? dayOfMonth : undefined,
      yearlyMonth: frequency === "yearly" ? yearlyMonth : undefined,
      yearlyDay: frequency === "yearly" ? yearlyDay : undefined,
      tags,
    }

    try {
      if (editingExpense) {
        await updateExpense(editingExpense.id, data)
      } else {
        await addExpense(data)
      }

      resetForm()
      setOpen(false)
      onClose?.()
    } catch {
      setErrors({ amount: t("form.save_failed") })
    }
  }

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      resetForm()
      onClose?.()
    }
  }

  async function handleDelete() {
    if (!editingExpense) return
    setDeleting(true)
    try {
      await removeExpense(editingExpense.id)
      setDeleteConfirmOpen(false)
      setOpen(false)
      onClose?.()
    } finally {
      setDeleting(false)
    }
  }

  const yearlyDaysAvailable = getDaysInMonth(yearlyMonth)

  const formContent = (
    <div className="flex flex-col gap-6 pt-2">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="expense-name" className="text-xs font-medium text-muted-foreground">
          {t("form.name")}
        </Label>
        <Input
          id="expense-name"
          placeholder={t("form.name_placeholder")}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
          }}
          className="h-11 border-border bg-background text-sm"
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      {/* Amount + Currency */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 flex flex-col gap-2">
          <Label htmlFor="expense-amount" className="text-xs font-medium text-muted-foreground">
            {t("form.amount")}
          </Label>
          <Input
            id="expense-amount"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value)
              if (errors.amount) setErrors((prev) => ({ ...prev, amount: "" }))
            }}
            className="h-11 border-border bg-background font-mono text-sm"
          />
          {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
        </div>

        <div className="col-span-2 flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">{t("form.currency")}</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="h-11 border-border bg-background text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-xs">{c.code}</span>
                    <span className="text-xs text-muted-foreground">{c.symbol}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Frequency - segmented control */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">{t("form.frequency")}</Label>
        <div className="flex rounded-lg border border-border bg-muted p-1">
          {FREQUENCY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFrequency(opt.value)}
              className={`flex-1 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                frequency === opt.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t(opt.key)}
            </button>
          ))}
        </div>
      </div>

      {/* Day of month picker - only for monthly */}
      {frequency === "monthly" && (
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">
            {t("form.day_of_month")}
          </Label>
          <Select value={dayOfMonth.toString()} onValueChange={(v) => setDayOfMonth(Number(v))}>
            <SelectTrigger className="h-11 border-border bg-background text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => (
                <SelectItem key={d} value={d.toString()}>
                  <span className="font-mono text-xs">{d}{getOrdinal(d)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">
            {t("form.day_of_month_hint")}
          </p>
        </div>
      )}

      {/* Yearly date picker - month and day */}
      {frequency === "yearly" && (
        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-muted-foreground">
            {t("form.date_of_year")}
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Select value={yearlyMonth.toString()} onValueChange={(v) => setYearlyMonth(Number(v))}>
              <SelectTrigger className="h-11 border-border bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTH_KEYS.map((key, i) => (
                  <SelectItem key={key} value={i.toString()}>
                    <span className="text-xs">{t(key)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearlyDay.toString()} onValueChange={(v) => setYearlyDay(Number(v))}>
              <SelectTrigger className="h-11 border-border bg-background text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: yearlyDaysAvailable }, (_, i) => i + 1).map((d) => (
                  <SelectItem key={d} value={d.toString()}>
                    <span className="font-mono text-xs">{d}{getOrdinal(d)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {t("form.date_of_year_hint")}
          </p>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-col gap-2">
        <Label className="text-xs font-medium text-muted-foreground">{t("tags.label")}</Label>
        <TagInput tags={tags} onChange={setTags} />
        <p className="text-[11px] text-muted-foreground">{t("tags.hint")}</p>
      </div>
    </div>
  )

  const dialogBody = (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">
          {editingExpense ? t("form.edit_expense") : t("form.new_expense")}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {editingExpense ? t("form.update_details") : t("form.add_entry")}
        </DialogDescription>
      </DialogHeader>
      {formContent}
      <DialogFooter className="gap-2 pt-4 sm:gap-2 flex items-center justify-between">
        {editingExpense && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {t("list.delete")}
          </Button>
        )}
        <div className="flex gap-2 sm:gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="flex-1 sm:flex-none"
          >
            {t("form.cancel")}
          </Button>
          <Button onClick={handleSubmit} className="flex-1 sm:flex-none">
            {editingExpense ? t("form.save_changes") : t("form.add_expense")}
          </Button>
        </div>
      </DialogFooter>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">{t("list.delete_expense")}</DialogTitle>
            <DialogDescription className="text-sm">
              {t("list.delete_confirm")} <span className="font-medium text-foreground">{name}</span>{"? "}{t("list.delete_irreversible")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 sm:gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)} className="flex-1 sm:flex-none" disabled={deleting}>
              {t("form.cancel")}
            </Button>
            <Button variant="destructive" onClick={handleDelete} className="flex-1 sm:flex-none" disabled={deleting}>
              {deleting ? t("list.delete") + "…" : t("list.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DialogContent>
  )

  if (!triggerButton) {
    return (
      <Dialog open={open} onOpenChange={handleOpenChange}>
        {dialogBody}
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          {t("form.add_expense")}
        </Button>
      </DialogTrigger>
      {dialogBody}
    </Dialog>
  )
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
