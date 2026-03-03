export interface Currency {
  code: string
  name: string
  symbol: string
  flag: string
}

export const CURRENCIES: Currency[] = [
  { code: "BAM", name: "Bosnian Convertible Mark", symbol: "KM", flag: "BA" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "US" },
  { code: "EUR", name: "Euro", symbol: "\u20AC", flag: "EU" },
  { code: "GBP", name: "British Pound", symbol: "\u00A3", flag: "GB" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "CH" },
  { code: "JPY", name: "Japanese Yen", symbol: "\u00A5", flag: "JP" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "CA" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "AU" },
  { code: "HRK", name: "Croatian Kuna", symbol: "kn", flag: "HR" },
  { code: "RSD", name: "Serbian Dinar", symbol: "din.", flag: "RS" },
  { code: "TRY", name: "Turkish Lira", symbol: "\u20BA", flag: "TR" },
  { code: "PLN", name: "Polish Zloty", symbol: "z\u0142", flag: "PL" },
  { code: "CZK", name: "Czech Koruna", symbol: "K\u010D", flag: "CZ" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft", flag: "HU" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "SE" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "NO" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "DK" },
  { code: "CNY", name: "Chinese Yuan", symbol: "\u00A5", flag: "CN" },
  { code: "INR", name: "Indian Rupee", symbol: "\u20B9", flag: "IN" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "BR" },
]

// Static fallback rates relative to BAM (used if the API is unavailable)
export const FALLBACK_RATES_FROM_BAM: Record<string, number> = {
  BAM: 1,
  USD: 0.56,
  EUR: 0.51,
  GBP: 0.44,
  CHF: 0.49,
  JPY: 82.5,
  CAD: 0.76,
  AUD: 0.85,
  HRK: 3.85,
  RSD: 59.8,
  TRY: 18.2,
  PLN: 2.27,
  CZK: 12.8,
  HUF: 197.5,
  SEK: 5.85,
  NOK: 5.95,
  DKK: 3.82,
  CNY: 4.05,
  INR: 46.5,
  BRL: 2.78,
}

export function getExchangeRate(
  fromCurrency: string,
  toCurrency: string,
  liveRates?: Record<string, number> | null
): number {
  if (fromCurrency === toCurrency) return 1

  const rates = liveRates ?? FALLBACK_RATES_FROM_BAM
  const fromRate = rates[fromCurrency]
  const toRate = rates[toCurrency]

  if (!fromRate || !toRate) return 1

  // Convert: amount in fromCurrency -> BAM -> toCurrency
  return toRate / fromRate
}

export function formatCurrency(amount: number, currencyCode: string, locale?: string): string {
  const currency = CURRENCIES.find((c) => c.code === currencyCode)
  const symbol = currency?.symbol ?? currencyCode

  const formatted = new Intl.NumberFormat(locale ?? "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))

  return `${symbol} ${formatted}`
}

export function getCurrencyByCode(code: string): Currency | undefined {
  return CURRENCIES.find((c) => c.code === code)
}
