import { NextResponse } from "next/server"

// BAM is pegged to EUR at a fixed rate (currency board arrangement)
const BAM_PER_EUR = 1.95583
// RSD approximate rate vs EUR (not in ECB data, updated periodically)
const RSD_PER_EUR = 117.2
// HRK was replaced by EUR on 1 Jan 2023 at the fixed rate
const HRK_PER_EUR = 7.53450

interface FrankfurterResponse {
  amount: number
  base: string
  date: string
  rates: Record<string, number>
}

async function fetchRates(): Promise<{
  rates: Record<string, number>
  date: string
  source: string
}> {
  // Fetch the latest daily closing rates (previous business day) from Frankfurter (ECB data)
  const res = await fetch("https://api.frankfurter.dev/v1/latest?base=EUR", {
    next: { revalidate: 3600 }, // Cache for 1 hour server-side
  })

  if (!res.ok) {
    throw new Error(`Frankfurter API error: ${res.status}`)
  }

  const data: FrankfurterResponse = await res.json()

  // Frankfurter returns rates relative to EUR.
  // We need rates relative to BAM for our app.
  // Since BAM is pegged: 1 EUR = 1.95583 BAM
  // So 1 BAM = 1/1.95583 EUR
  // To get X per BAM: (X per EUR) / (BAM per EUR)

  const eurRates = data.rates
  const ratesFromBAM: Record<string, number> = { BAM: 1 }

  // Add EUR itself
  ratesFromBAM.EUR = 1 / BAM_PER_EUR // ~0.5113

  // Convert all Frankfurter rates from EUR-base to BAM-base
  for (const [code, ratePerEur] of Object.entries(eurRates)) {
    ratesFromBAM[code] = ratePerEur / BAM_PER_EUR
  }

  // Add pegged/approximated currencies not in Frankfurter
  ratesFromBAM.HRK = HRK_PER_EUR / BAM_PER_EUR
  ratesFromBAM.RSD = RSD_PER_EUR / BAM_PER_EUR

  return {
    rates: ratesFromBAM,
    date: data.date,
    source: "ECB via Frankfurter",
  }
}

export async function GET() {
  try {
    const { rates, date, source } = await fetchRates()

    return NextResponse.json(
      { rates, date, source },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    )
  } catch (error) {
    console.error("Exchange rate fetch failed:", error)

    // Return a fallback error response
    return NextResponse.json(
      { error: "Failed to fetch exchange rates" },
      { status: 502 }
    )
  }
}
