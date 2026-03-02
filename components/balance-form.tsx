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
import type { Balance, BalanceFormData } from "@/lib/types"
import { useBalances } from "@/lib/balance-context"
import { useExpenses } from "@/lib/expense-context"

interface BalanceFormProps {
  editingBalance?: Balance | null
  onClose?: () => void
  triggerButton?: boolean
}

export function BalanceForm({ editingBalance, onClose, triggerButton = true }: BalanceFormProps) {
  const { addBalance, updateBalance, removeBalance } = useBalances()
  const { globalCurrency } = useExpenses()
  const [open, setOpen] = useState(!triggerButton)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const [name, setName] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState(globalCurrency)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (editingBalance) {
      setName(editingBalance.name)
      setAmount(editingBalance.amount.toString())
      setCurrency(editingBalance.currency)
      setOpen(true)
    }
  }, [editingBalance])

  useEffect(() => {
    if (!editingBalance) {
      setCurrency(globalCurrency)
    }
  }, [globalCurrency, editingBalance])

  function resetForm() {
    setName("")
    setAmount("")
    setCurrency(globalCurrency)
    setErrors({})
    setSaving(false)
  }

  function validate(): boolean {
    const newErrors: Record<string, string> = {}
    if (!name.trim()) newErrors.name = "Name is required"
    const parsed = Number(amount)
    if (!amount || Number.isNaN(parsed) || parsed < 0) {
      newErrors.amount = "Enter a valid amount (0 or greater)"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return

    const data: BalanceFormData = {
      name: name.trim(),
      amount,
      currency,
    }

    setSaving(true)
    try {
      if (editingBalance) {
        await updateBalance(editingBalance.id, data)
      } else {
        await addBalance(data)
      }
      resetForm()
      setOpen(false)
      onClose?.()
    } catch {
      setErrors({ submit: "Failed to save. Please try again." })
      setSaving(false)
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
    if (!editingBalance) return
    setDeleting(true)
    try {
      await removeBalance(editingBalance.id)
      setDeleteConfirmOpen(false)
      setOpen(false)
      onClose?.()
    } finally {
      setDeleting(false)
    }
  }

  const formContent = (
    <div className="flex flex-col gap-6 pt-2">
      {/* Name */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="balance-name" className="text-xs font-medium text-muted-foreground">
          Account Name
        </Label>
        <Input
          id="balance-name"
          placeholder="e.g. Cash, Savings, Checking"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            if (errors.name) setErrors((prev) => ({ ...prev, name: "" }))
          }}
          className="h-11 border-border bg-background text-sm"
          autoFocus
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      {/* Amount + Currency */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-3 flex flex-col gap-2">
          <Label htmlFor="balance-amount" className="text-xs font-medium text-muted-foreground">
            Balance
          </Label>
          <Input
            id="balance-amount"
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
          <Label className="text-xs font-medium text-muted-foreground">Currency</Label>
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

      {errors.submit && <p className="text-xs text-destructive">{errors.submit}</p>}
    </div>
  )

  const dialogBody = (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">
          {editingBalance ? "Edit Account" : "Add Account"}
        </DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          {editingBalance
            ? "Update this account's balance."
            : "Add a new account to track its balance."}
        </DialogDescription>
      </DialogHeader>

      {formContent}

      <DialogFooter className="gap-2 pt-4 sm:gap-2 flex items-center justify-between">
        {editingBalance && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteConfirmOpen(true)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={saving || deleting}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        )}
        <div className="flex gap-2 sm:gap-2 ml-auto">
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            className="flex-1 sm:flex-none"
            disabled={saving || deleting}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="flex-1 sm:flex-none" disabled={saving || deleting}>
            {saving ? "Saving…" : editingBalance ? "Save Changes" : "Add Account"}
          </Button>
        </div>
      </DialogFooter>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Delete Account</DialogTitle>
            <DialogDescription className="text-sm">
              Delete <span className="font-medium text-foreground">{name}</span>? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="flex-1 sm:flex-none"
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="flex-1 sm:flex-none"
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
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
          Add Account
        </Button>
      </DialogTrigger>
      {dialogBody}
    </Dialog>
  )
}
