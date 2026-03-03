"use client"

import { useCallback } from "react"
import { useProfile } from "@/lib/contexts/profile-context"
import { translations, type TranslationKey } from "./translations"

/**
 * Returns a `t` function that resolves a translation key to the current language.
 * Falls back to English if the current language has no entry for a key.
 */
export function useTranslation() {
  const { preferredLanguage } = useProfile()

  const t = useCallback(
    (key: TranslationKey): string => {
      const entry = translations[key]
      if (!entry) return key

      // Try exact match, then fallback to English
      return (entry as Record<string, string>)[preferredLanguage]
        ?? (entry as Record<string, string>).en
        ?? key
    },
    [preferredLanguage],
  )

  return { t, lang: preferredLanguage }
}
