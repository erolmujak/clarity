"use client"

import React, { createContext, useContext, useCallback, useMemo, useState, useEffect, useRef } from "react"
import useSWR, { mutate as globalMutate } from "swr"
import { createClient } from "@/lib/supabase/client"

const PROFILE_KEY = "supabase-profile"

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

interface ProfileContextValue {
  globalCurrency: string
  preferredLanguage: string
  displayName: string
  loading: boolean
  setGlobalCurrency: (c: string) => void
  setPreferredLanguage: (lang: string) => void
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading } = useSWR(PROFILE_KEY, fetchProfile, {
    fallbackData: { globalCurrency: "BAM", displayName: "", preferredLanguage: "en" },
    revalidateOnFocus: false,
  })

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

  const globalCurrency = localCurrency ?? profile?.globalCurrency ?? "BAM"
  const preferredLanguage = localLanguage ?? profile?.preferredLanguage ?? "en"
  const displayName = profile?.displayName ?? ""

  // Apply language to <html> element
  useEffect(() => {
    document.documentElement.lang = preferredLanguage
  }, [preferredLanguage])

  const setGlobalCurrency = useCallback(async (c: string) => {
    setLocalCurrency(c)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from("profiles")
      .update({ preferred_currency: c, updated_at: new Date().toISOString() })
      .eq("id", user.id)
  }, [])

  const setPreferredLanguage = useCallback(async (lang: string) => {
    setLocalLanguage(lang)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase
      .from("profiles")
      .update({ preferred_language: lang, updated_at: new Date().toISOString() })
      .eq("id", user.id)
  }, [])

  const refreshProfile = useCallback(async () => {
    await globalMutate(PROFILE_KEY)
  }, [])

  const value = useMemo<ProfileContextValue>(
    () => ({ globalCurrency, preferredLanguage, displayName, loading: isLoading, setGlobalCurrency, setPreferredLanguage, refreshProfile }),
    [globalCurrency, preferredLanguage, displayName, isLoading, setGlobalCurrency, setPreferredLanguage, refreshProfile],
  )

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider")
  return ctx
}
