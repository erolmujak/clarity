"use client"

import React, { createContext, useContext, useMemo } from "react"
import useSWR from "swr"

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

interface RatesContextValue {
  liveRates: Record<string, number> | null
  ratesDate: string | null
  ratesSource: string | null
}

const RatesContext = createContext<RatesContextValue | null>(null)

export function RatesProvider({ children }: { children: React.ReactNode }) {
  const { data: ratesData } = useSWR(RATES_KEY, fetchExchangeRates, {
    revalidateOnFocus: false,
    refreshInterval: 3600000,
    dedupingInterval: 600000,
  })

  const value = useMemo<RatesContextValue>(
    () => ({
      liveRates: ratesData?.rates ?? null,
      ratesDate: ratesData?.date ?? null,
      ratesSource: ratesData?.source ?? null,
    }),
    [ratesData],
  )

  return <RatesContext.Provider value={value}>{children}</RatesContext.Provider>
}

export function useRates() {
  const ctx = useContext(RatesContext)
  if (!ctx) throw new Error("useRates must be used within RatesProvider")
  return ctx
}
