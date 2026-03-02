export type Frequency = "weekly" | "monthly" | "yearly"

export type ActiveView = "expenses" | "balances" | "settings"

export interface Expense {
  id: string
  name: string
  amount: number
  frequency: Frequency
  currency: string
  dateAdded: string // ISO date string
  rateToBAM: number // Exchange rate to BAM at time of entry
  dayOfMonth?: number // 1-31, used for monthly frequency
  yearlyMonth?: number // 0-11, used for yearly frequency
  yearlyDay?: number // 1-31, used for yearly frequency
  tags: string[]
}

export interface ExpenseFormData {
  name: string
  amount: string
  frequency: Frequency
  currency: string
  dayOfMonth?: number
  yearlyMonth?: number
  yearlyDay?: number
  tags?: string[]
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
}

export const FREQUENCY_MONTHLY_MULTIPLIERS: Record<Frequency, number> = {
  weekly: 4.333, // avg weeks per month
  monthly: 1,
  yearly: 1 / 12,
}

export interface Balance {
  id: string
  name: string
  amount: number
  currency: string
  rateToBAM: number // Exchange rate to BAM at time of entry
  createdAt: string
}

export interface BalanceFormData {
  name: string
  amount: string
  currency: string
}
