"use client"

import React, { createContext, useContext, useCallback, useMemo } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import type { Expense, ExpenseFormData } from "@/lib/types"
import { getExchangeRate } from "@/lib/currencies"
import { FREQUENCY_MONTHLY_MULTIPLIERS } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { useProfile } from "./profile-context"
import { useRates } from "./rates-context"

// ─── DB helpers ──────────────────────────────────────────────

function dbToExpense(row: Record<string, unknown>): Expense {
  return {
    id: row.id as string,
    name: row.name as string,
    amount: Number(row.amount),
    frequency: row.frequency as Expense["frequency"],
    currency: row.currency as string,
    dateAdded: row.created_at as string,
    rateToBAM: Number(row.rate_to_bam),
    dayOfMonth: row.day_of_month != null ? Number(row.day_of_month) : undefined,
    yearlyMonth: row.yearly_month != null ? Number(row.yearly_month) : undefined,
    yearlyDay: row.yearly_day != null ? Number(row.yearly_day) : undefined,
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
  }
}

const EXPENSES_KEY = "supabase-expenses"

async function fetchExpenses(): Promise<Expense[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data ?? []).map(dbToExpense)
}

// ─── Context ─────────────────────────────────────────────────

interface ExpenseContextValue {
  expenses: Expense[]
  loading: boolean
  addExpense: (data: ExpenseFormData) => Promise<void>
  updateExpense: (id: string, data: ExpenseFormData) => Promise<void>
  removeExpense: (id: string) => Promise<void>
  monthlyTotalInGlobal: number
  getMonthlyAmountInGlobal: (expense: Expense) => number
  allTags: string[]
  renameTag: (oldName: string, newName: string) => Promise<void>
  deleteTag: (tag: string) => Promise<void>
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null)

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { data: expenses = [], isLoading } = useSWR(EXPENSES_KEY, fetchExpenses, {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  const { globalCurrency } = useProfile()
  const { liveRates } = useRates()

  // ── CRUD ──────────────────────────────────────────────────

  const addExpense = useCallback(async (data: ExpenseFormData) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const newRow = {
      user_id: user.id,
      name: data.name,
      amount: Number.parseFloat(data.amount),
      frequency: data.frequency,
      currency: data.currency,
      rate_to_bam: getExchangeRate(data.currency, "BAM", liveRates),
      day_of_month: data.dayOfMonth ?? null,
      yearly_month: data.yearlyMonth ?? null,
      yearly_day: data.yearlyDay ?? null,
      tags: data.tags ?? [],
    }

    const { data: inserted, error } = await supabase
      .from("expenses")
      .insert(newRow)
      .select()
      .single()

    if (error) throw error

    globalMutate(EXPENSES_KEY, (prev: Expense[] | undefined) => [
      ...(prev ?? []),
      dbToExpense(inserted),
    ], false)
  }, [liveRates])

  const updateExpense = useCallback(async (id: string, data: ExpenseFormData) => {
    const supabase = createClient()

    const updates = {
      name: data.name,
      amount: Number.parseFloat(data.amount),
      frequency: data.frequency,
      currency: data.currency,
      rate_to_bam: getExchangeRate(data.currency, "BAM", liveRates),
      day_of_month: data.dayOfMonth ?? null,
      yearly_month: data.yearlyMonth ?? null,
      yearly_day: data.yearlyDay ?? null,
      tags: data.tags ?? [],
      updated_at: new Date().toISOString(),
    }

    const { data: updated, error } = await supabase
      .from("expenses")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error

    globalMutate(EXPENSES_KEY, (prev: Expense[] | undefined) =>
      (prev ?? []).map((e) => (e.id === id ? dbToExpense(updated) : e)),
      false,
    )
  }, [liveRates])

  const removeExpense = useCallback(async (id: string) => {
    globalMutate(EXPENSES_KEY, (prev: Expense[] | undefined) =>
      (prev ?? []).filter((e) => e.id !== id),
      false,
    )

    const supabase = createClient()
    const { error } = await supabase.from("expenses").delete().eq("id", id)
    if (error) {
      globalMutate(EXPENSES_KEY)
      throw error
    }
  }, [])

  // ── Bulk tag operations ────────────────────────────────────

  const renameTag = useCallback(async (oldName: string, newName: string) => {
    const normalized = newName.trim().toLowerCase()
    if (!normalized || normalized === oldName) return

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const affected = expenses.filter((e) => e.tags.includes(oldName))
    if (affected.length === 0) return

    globalMutate(EXPENSES_KEY, (prev: Expense[] | undefined) =>
      (prev ?? []).map((e) => {
        if (!e.tags.includes(oldName)) return e
        const newTags = e.tags.map((t) => (t === oldName ? normalized : t))
        return { ...e, tags: [...new Set(newTags)] }
      }),
      false,
    )

    try {
      await Promise.all(
        affected.map((expense) => {
          const newTags = expense.tags.map((t) => (t === oldName ? normalized : t))
          return supabase
            .from("expenses")
            .update({ tags: [...new Set(newTags)], updated_at: new Date().toISOString() })
            .eq("id", expense.id)
        })
      )
    } catch {
      globalMutate(EXPENSES_KEY)
      throw new Error("Failed to rename tag")
    }

    globalMutate(EXPENSES_KEY)
  }, [expenses])

  const deleteTag = useCallback(async (tag: string) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const affected = expenses.filter((e) => e.tags.includes(tag))
    if (affected.length === 0) return

    globalMutate(EXPENSES_KEY, (prev: Expense[] | undefined) =>
      (prev ?? []).map((e) => {
        if (!e.tags.includes(tag)) return e
        return { ...e, tags: e.tags.filter((t) => t !== tag) }
      }),
      false,
    )

    try {
      await Promise.all(
        affected.map((expense) =>
          supabase
            .from("expenses")
            .update({ tags: expense.tags.filter((t) => t !== tag), updated_at: new Date().toISOString() })
            .eq("id", expense.id)
        )
      )
    } catch {
      globalMutate(EXPENSES_KEY)
      throw new Error("Failed to delete tag")
    }

    globalMutate(EXPENSES_KEY)
  }, [expenses])

  // ── Computed ──────────────────────────────────────────────

  const getMonthlyAmountInGlobal = useCallback(
    (expense: Expense) => {
      const monthlyAmount = expense.amount * FREQUENCY_MONTHLY_MULTIPLIERS[expense.frequency]
      const amountInBAM = monthlyAmount * expense.rateToBAM
      if (globalCurrency === "BAM") return amountInBAM
      return amountInBAM * getExchangeRate("BAM", globalCurrency, liveRates)
    },
    [globalCurrency, liveRates],
  )

  const monthlyTotalInGlobal = useMemo(
    () => expenses.reduce((sum, e) => sum + getMonthlyAmountInGlobal(e), 0),
    [expenses, getMonthlyAmountInGlobal],
  )

  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    for (const e of expenses) {
      for (const t of e.tags) tagSet.add(t)
    }
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b))
  }, [expenses])

  const value = useMemo<ExpenseContextValue>(
    () => ({
      expenses,
      loading: isLoading,
      addExpense,
      updateExpense,
      removeExpense,
      monthlyTotalInGlobal,
      getMonthlyAmountInGlobal,
      allTags,
      renameTag,
      deleteTag,
    }),
    [expenses, isLoading, addExpense, updateExpense, removeExpense, monthlyTotalInGlobal, getMonthlyAmountInGlobal, allTags, renameTag, deleteTag],
  )

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext)
  if (!ctx) throw new Error("useExpenses must be used within ExpenseProvider")
  return ctx
}
