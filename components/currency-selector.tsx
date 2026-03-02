"use client"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CURRENCIES } from "@/lib/currencies"
import { useExpenses } from "@/lib/expense-context"

export function CurrencySelector() {
  const { globalCurrency, setGlobalCurrency } = useExpenses()

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] uppercase tracking-widest text-sidebar-muted">
        Display currency
      </label>
      <Select value={globalCurrency} onValueChange={setGlobalCurrency}>
        <SelectTrigger className="h-9 border-sidebar-border bg-sidebar-accent text-xs text-sidebar-foreground">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              <span className="flex items-center gap-2">
                <span className="font-mono text-xs">{c.code}</span>
                <span className="text-muted-foreground">{c.symbol}</span>
                <span className="truncate text-xs text-muted-foreground">{c.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
