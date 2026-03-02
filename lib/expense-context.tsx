"use client"

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect, useRef } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import type { Expense, ExpenseFormData } from "./types"
import { getExchangeRate } from "./currencies"
import { FREQUENCY_MONTHLY_MULTIPLIERS } from "./types"
import { createClient } from "@/lib/supabase/client"

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

// ─── SWR fetcher ─────────────────────────────────────────────

const EXPENSES_KEY = "supabase-expenses"
const PROFILE_KEY = "supabase-profile"
const RATES_KEY = "/api/exchange-rates"

interface ExchangeRateData {
  rates: Record<string, number>
  date: string
  source: string
}

async function fetchExchangeRates(): Promise<ExchangeRateData | null> {
  try {
    const res = await fetch(RATES_KEY)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

async function fetchExpenses(): Promise<Expense[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data ?? []).map(dbToExpense)
}

async function fetchProfile(): Promise<{ globalCurrency: string; displayName: string; preferredLanguage: string }> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { globalCurrency: "BAM", displayName: "", preferredLanguage: "en" }

  const { data, error } = await supabase
    .from("profiles")
    .select("preferred_currency, display_name, preferred_language")
    .eq("id", user.id)
    .single()

  if (error || !data) return { globalCurrency: "BAM", displayName: "", preferredLanguage: "en" }
  return {
    globalCurrency: (data.preferred_currency as string) || "BAM",
    displayName: (data.display_name as string) || "",
    preferredLanguage: (data.preferred_language as string) || "en",
  }
}

// ─── Context ─────────────────────────────────────────────────

interface ExpenseContextValue {
  expenses: Expense[]
  globalCurrency: string
  preferredLanguage: string
  displayName: string
  loading: boolean
  liveRates: Record<string, number> | null
  ratesDate: string | null
  ratesSource: string | null
  setGlobalCurrency: (c: string) => void
  setPreferredLanguage: (lang: string) => void
  addExpense: (data: ExpenseFormData) => Promise<void>
  updateExpense: (id: string, data: ExpenseFormData) => Promise<void>
  removeExpense: (id: string) => Promise<void>
  monthlyTotalInGlobal: number
  getMonthlyAmountInGlobal: (expense: Expense) => number
  allTags: string[]
  renameTag: (oldName: string, newName: string) => Promise<void>
  deleteTag: (tag: string) => Promise<void>
  refreshProfile: () => Promise<void>
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null)

export function ExpenseProvider({ children }: { children: React.ReactNode }) {
  const { data: expenses = [], isLoading: expensesLoading } = useSWR(EXPENSES_KEY, fetchExpenses, {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  const { data: profile, isLoading: profileLoading } = useSWR(PROFILE_KEY, fetchProfile, {
    fallbackData: { globalCurrency: "BAM", displayName: "", preferredLanguage: "en" },
    revalidateOnFocus: false,
  })

  const { data: ratesData } = useSWR(RATES_KEY, fetchExchangeRates, {
    revalidateOnFocus: false,
    refreshInterval: 3600000, // Re-fetch every hour
    dedupingInterval: 600000, // Dedup for 10 minutes
  })

  const liveRates = ratesData?.rates ?? null
  const ratesDate = ratesData?.date ?? null
  const ratesSource = ratesData?.source ?? null

  // Local state for currency and language — decoupled from SWR so selections
  // are instant and never reverted by a re-fetch racing against the DB write.
  const [localCurrency, setLocalCurrency] = useState<string | null>(null)
  const [localLanguage, setLocalLanguage] = useState<string | null>(null)
  const profileLoaded = useRef(false)

  // Seed local state from SWR profile exactly once (on first successful fetch).
  useEffect(() => {
    if (profile && !profileLoaded.current) {
      profileLoaded.current = true
      setLocalCurrency(profile.globalCurrency)
      setLocalLanguage(profile.preferredLanguage)
    }
  }, [profile])

  // Local state wins; SWR profile is only used as the initial seed and for displayName.
  const globalCurrency = localCurrency ?? profile?.globalCurrency ?? "BAM"
  const preferredLanguage = localLanguage ?? profile?.preferredLanguage ?? "en"
  const displayName = profile?.displayName ?? ""
  const loading = expensesLoading || profileLoading

  // Apply language to <html> element
  useEffect(() => {
    document.documentElement.lang = preferredLanguage
  }, [preferredLanguage])

  // ── Currency / Language ────────────────────────────────────

  const setGlobalCurrency = useCallback(async (c: string) => {
    setLocalCurrency(c) // instant UI — no SWR involved

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("profiles")
      .update({ preferred_currency: c, updated_at: new Date().toISOString() })
      .eq("id", user.id)
    // No globalMutate — local state already reflects the new value
  }, [])

  const setPreferredLanguage = useCallback(async (lang: string) => {
    setLocalLanguage(lang) // instant UI — no SWR involved

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase
      .from("profiles")
      .update({ preferred_language: lang, updated_at: new Date().toISOString() })
      .eq("id", user.id)
    // No globalMutate — local state already reflects the new value
  }, [])

  const refreshProfile = useCallback(async () => {
    // Re-fetch profile from DB (used after display name changes).
    // Does NOT reset localCurrency/localLanguage — those are owned by local state.
    await globalMutate(PROFILE_KEY)
  }, [])

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

    // Optimistic append
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
    // Optimistic remove
    globalMutate(EXPENSES_KEY, (prev: Expense[] | undefined) =>
      (prev ?? []).filter((e) => e.id !== id),
      false,
    )

    const supabase = createClient()
    const { error } = await supabase.from("expenses").delete().eq("id", id)
    if (error) {
      // Re-fetch to rollback the optimistic update
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

    // Find all expenses that contain the old tag
    const affected = expenses.filter((e) => e.tags.includes(oldName))
    if (affected.length === 0) return

    // Optimistic update
    globalMutate(EXPENSES_KEY, (prev: Expense[] | undefined) =>
      (prev ?? []).map((e) => {
        if (!e.tags.includes(oldName)) return e
        const newTags = e.tags.map((t) => (t === oldName ? normalized : t))
        // Deduplicate in case newName already existed on this expense
        return { ...e, tags: [...new Set(newTags)] }
      }),
      false,
    )

    // Update all affected expenses in DB concurrently
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
      // Re-fetch to rollback optimistic update
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

    // Optimistic update
    globalMutate(EXPENSES_KEY, (prev: Expense[] | undefined) =>
      (prev ?? []).map((e) => {
        if (!e.tags.includes(tag)) return e
        return { ...e, tags: e.tags.filter((t) => t !== tag) }
      }),
      false,
    )

    // Update all affected expenses in DB concurrently
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
      // Re-fetch to rollback optimistic update
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
      globalCurrency,
      preferredLanguage,
      displayName,
      loading,
      liveRates,
      ratesDate,
      ratesSource,
      setGlobalCurrency,
      setPreferredLanguage,
      addExpense,
      updateExpense,
      removeExpense,
      monthlyTotalInGlobal,
      getMonthlyAmountInGlobal,
      allTags,
      renameTag,
      deleteTag,
      refreshProfile,
    }),
    [expenses, globalCurrency, preferredLanguage, displayName, loading, liveRates, ratesDate, ratesSource, setGlobalCurrency, setPreferredLanguage, addExpense, updateExpense, removeExpense, monthlyTotalInGlobal, getMonthlyAmountInGlobal, allTags, renameTag, deleteTag, refreshProfile],
  )

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
}

export function useExpenses() {
  const ctx = useContext(ExpenseContext)
  if (!ctx) throw new Error("useExpenses must be used within ExpenseProvider")
  return ctx
}
