"use client"

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { useTranslation } from "@/lib/i18n"
import { ExpensesSidebar } from "./expenses-sidebar"

interface MobileSidebarSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MobileSidebarSheet({ open, onOpenChange }: MobileSidebarSheetProps) {
  const { t } = useTranslation()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 p-0">
        <SheetTitle className="sr-only">{t("sidebar.expense_summary")}</SheetTitle>
        <SheetDescription className="sr-only">
          {t("sidebar.expense_summary_desc")}
        </SheetDescription>
        <ExpensesSidebar />
      </SheetContent>
    </Sheet>
  )
}
