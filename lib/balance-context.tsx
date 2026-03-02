"use client"

import React, { createContext, useContext, useCallback, useMemo } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import type { Balance, BalanceFormData } from "./types"
import { getExchangeRate } from "./currencies"
import { createClient } from "@/lib/supabase/client"
import { useExpenses } from "./expense-context"

// ─── DB helpers ───────────────────────────────────────────────

function dbToBalance(row: Record<string, unknown>): Balance {
  return {
    id: row.id as string,
    name: row.name as string,
    amount: Number(row.amount),
    currency: row.currency as string,
    rateToBAM: Number(row.rate_to_bam),
    createdAt: row.created_at as string,
  }
}

// ─── SWR fetcher ──────────────────────────────────────────────

const BALANCES_KEY = "supabase-balances"

async function fetchBalances(): Promise<Balance[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("balances")
    .select("*")
    .order("created_at", { ascending: true })

  if (error) throw error
  return (data ?? []).map(dbToBalance)
}

// ─── Context ──────────────────────────────────────────────────

interface BalanceContextValue {
  balances: Balance[]
  loading: boolean
  totalInGlobal: number
  getAmountInGlobal: (balance: Balance) => number
  addBalance: (data: BalanceFormData) => Promise<void>
  updateBalance: (id: string, data: BalanceFormData) => Promise<void>
  removeBalance: (id: string) => Promise<void>
}

const BalanceContext = createContext<BalanceContextValue | null>(null)

// BalanceProvider must be nested inside ExpenseProvider so it can
// access liveRates and globalCurrency for currency conversion.
export function BalanceProvider({ children }: { children: React.ReactNode }) {
  const { data: balances = [], isLoading } = useSWR(BALANCES_KEY, fetchBalances, {
    fallbackData: [],
    revalidateOnFocus: false,
  })

  const { liveRates, globalCurrency } = useExpenses()

  // Convert a balance's original amount to the user's global currency.
  // Uses the rate stored at entry time for the BAM leg, then live rates
  // for BAM → globalCurrency — same pattern as expenses.
  const getAmountInGlobal = useCallback(
    (balance: Balance) => {
      const amountInBAM = balance.amount * balance.rateToBAM
      if (globalCurrency === "BAM") return amountInBAM
      return amountInBAM * getExchangeRate("BAM", globalCurrency, liveRates)
    },
    [globalCurrency, liveRates],
  )

  const totalInGlobal = useMemo(
    () => balances.reduce((sum, b) => sum + getAmountInGlobal(b), 0),
    [balances, getAmountInGlobal],
  )

  // ── CRUD ────────────────────────────────────────────────────

  const addBalance = useCallback(
    async (data: BalanceFormData) => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newRow = {
        user_id: user.id,
        name: data.name,
        amount: Number.parseFloat(data.amount),
        currency: data.currency,
        rate_to_bam: getExchangeRate(data.currency, "BAM", liveRates),
      }

      const { data: inserted, error } = await supabase
        .from("balances")
        .insert(newRow)
        .select()
        .single()

      if (error) throw error

      // Optimistic append
      globalMutate(
        BALANCES_KEY,
        (prev: Balance[] | undefined) => [...(prev ?? []), dbToBalance(inserted)],
        false,
      )
    },
    [liveRates],
  )

  const updateBalance = useCallback(
    async (id: string, data: BalanceFormData) => {
      const supabase = createClient()

      const updates = {
        name: data.name,
        amount: Number.parseFloat(data.amount),
        currency: data.currency,
        rate_to_bam: getExchangeRate(data.currency, "BAM", liveRates),
        updated_at: new Date().toISOString(),
      }

      const { data: updated, error } = await supabase
        .from("balances")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

      if (error) throw error

      globalMutate(
        BALANCES_KEY,
        (prev: Balance[] | undefined) =>
          (prev ?? []).map((b) => (b.id === id ? dbToBalance(updated) : b)),
        false,
      )
    },
    [liveRates],
  )

  const removeBalance = useCallback(async (id: string) => {
    // Optimistic remove
    globalMutate(
      BALANCES_KEY,
      (prev: Balance[] | undefined) => (prev ?? []).filter((b) => b.id !== id),
      false,
    )

    const supabase = createClient()
    const { error } = await supabase.from("balances").delete().eq("id", id)
    if (error) {
      globalMutate(BALANCES_KEY) // rollback
      throw error
    }
  }, [])

  const value = useMemo<BalanceContextValue>(
    () => ({
      balances,
      loading: isLoading,
      totalInGlobal,
      getAmountInGlobal,
      addBalance,
      updateBalance,
      removeBalance,
    }),
    [balances, isLoading, totalInGlobal, getAmountInGlobal, addBalance, updateBalance, removeBalance],
  )

  return <BalanceContext.Provider value={value}>{children}</BalanceContext.Provider>
}

export function useBalances() {
  const ctx = useContext(BalanceContext)
  if (!ctx) throw new Error("useBalances must be used within BalanceProvider")
  return ctx
}
