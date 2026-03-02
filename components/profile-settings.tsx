"use client"

import React from "react"
import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useExpenses } from "@/lib/expense-context"
import { CURRENCIES } from "@/lib/currencies"
import { LANGUAGES, getLanguageByCode } from "@/lib/languages"
import { useTranslation } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Search, Pencil, Trash2, X, ChevronLeft, User, Globe, Tag, Lock, LogOut } from "lucide-react"

// ── Reusable searchable picker ──────────────────────────────

function SearchableList<T extends { code: string }>({
  items,
  selected,
  onSelect,
  renderItem,
  searchPlaceholder,
  noResults,
}: {
  items: T[]
  selected: string
  onSelect: (code: string) => void
  renderItem: (item: T) => React.ReactNode
  searchPlaceholder: string
  noResults: string
}) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    if (!search.trim()) return items
    const q = search.toLowerCase()
    return items.filter((item) => {
      const values = Object.values(item).filter((v) => typeof v === "string")
      return values.some((v) => (v as string).toLowerCase().includes(q))
    })
  }, [items, search])

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 border-border bg-background pl-9 text-sm"
        />
      </div>
      <div className="max-h-56 overflow-y-auto rounded-md border border-border bg-background">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">{noResults}</p>
        ) : (
          filtered.map((item) => {
            const isSelected = item.code === selected
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => onSelect(item.code)}
                className={`flex w-full items-center justify-between px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted/60 ${
                  isSelected ? "bg-muted" : ""
                }`}
              >
                {renderItem(item)}
                {isSelected && <Check className="h-3.5 w-3.5 shrink-0 text-foreground" />}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

// ── Section Components ──────────────────────────────────────

interface ProfileSectionProps {
  displayName: string
  email: string
  isOAuthUser: boolean
  saving: boolean
  message: { type: "success" | "error"; text: string } | null
  onNameChange: (name: string) => void
  onSave: () => void
}

function ProfileSection({
  displayName,
  email,
  isOAuthUser,
  saving,
  message,
  onNameChange,
  onSave,
}: ProfileSectionProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="settings-name" className="text-sm text-foreground">
          {t("settings.display_name")}
        </Label>
        <Input
          id="settings-name"
          value={displayName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t("settings.your_name")}
          className="h-11 border-border bg-card text-sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label className="text-sm text-foreground">{t("settings.email")}</Label>
        <Input
          value={email}
          disabled
          className="h-11 border-border bg-muted text-sm text-muted-foreground"
        />
      </div>

      {isOAuthUser && (
        <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2.5">
          <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          <span className="text-xs text-muted-foreground">{t("settings.signed_google")}</span>
        </div>
      )}

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-foreground" : "text-destructive"}`}>
          {message.text}
        </p>
      )}

      <Button onClick={onSave} disabled={saving} className="h-11 w-full">
        {saving ? t("settings.saving") : t("settings.save_profile")}
      </Button>
    </div>
  )
}

interface LanguageSectionProps {
  preferredLanguage: string
  onSelect: (code: string) => void
}

function LanguageSection({ preferredLanguage, onSelect }: LanguageSectionProps) {
  const { t } = useTranslation()
  const currentLanguage = getLanguageByCode(preferredLanguage)
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        {currentLanguage ? `${currentLanguage.name} (${currentLanguage.nativeName})` : preferredLanguage}
      </p>
      <SearchableList
        items={LANGUAGES}
        selected={preferredLanguage}
        onSelect={onSelect}
        searchPlaceholder={t("settings.search_languages")}
        noResults={t("settings.no_results")}
        renderItem={(lang) => (
          <div className="flex flex-col gap-0.5">
            <span className="text-sm text-foreground">{lang.name}</span>
            <span className="text-xs text-muted-foreground">{lang.nativeName}</span>
          </div>
        )}
      />
    </div>
  )
}

interface CurrencySectionProps {
  globalCurrency: string
  onSelect: (code: string) => void
}

function CurrencySection({ globalCurrency, onSelect }: CurrencySectionProps) {
  const { t } = useTranslation()
  const currentCurrency = CURRENCIES.find((c) => c.code === globalCurrency)
  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-muted-foreground">
        {currentCurrency ? `${currentCurrency.symbol} ${currentCurrency.code} — ${currentCurrency.name}` : globalCurrency}
      </p>
      <SearchableList
        items={CURRENCIES}
        selected={globalCurrency}
        onSelect={onSelect}
        searchPlaceholder={t("settings.search_currencies")}
        noResults={t("settings.no_results")}
        renderItem={(curr) => (
          <div className="flex items-center gap-2.5">
            <span className="w-6 text-center text-sm font-medium text-foreground">{curr.symbol}</span>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm text-foreground">{curr.code}</span>
              <span className="text-xs text-muted-foreground">{curr.name}</span>
            </div>
          </div>
        )}
      />
    </div>
  )
}

interface TagsSectionProps {
  allTags: string[]
  saving: boolean
  onRename: (oldTag: string, newTag: string) => Promise<void>
  onDelete: (tag: string) => Promise<void>
}

function TagsSection({ allTags, saving, onRename, onDelete }: TagsSectionProps) {
  const { t } = useTranslation()
  const [tagSearch, setTagSearch] = useState("")
  const [editingTag, setEditingTag] = useState<string | null>(null)
  const [editingTagValue, setEditingTagValue] = useState("")

  return (
    <div className="flex flex-col gap-3">
      {allTags.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("tags.no_tags")}</p>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("tags.search_tags")}
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="h-9 border-border bg-background pl-9 text-sm"
            />
          </div>
          <div className="rounded-md border border-border bg-background">
            {allTags
              .filter((tag) => !tagSearch.trim() || tag.toLowerCase().includes(tagSearch.toLowerCase()))
              .map((tag) => (
                <div
                  key={tag}
                  className="flex items-center justify-between border-b border-border px-3 py-2.5 last:border-b-0"
                >
                  {editingTag === tag ? (
                    <form
                      className="flex flex-1 items-center gap-2"
                      onSubmit={async (e) => {
                        e.preventDefault()
                        if (editingTagValue.trim() && editingTagValue.trim().toLowerCase() !== tag) {
                          await onRename(tag, editingTagValue.trim())
                        }
                        setEditingTag(null)
                        setEditingTagValue("")
                      }}
                    >
                      <Input
                        value={editingTagValue}
                        onChange={(e) => setEditingTagValue(e.target.value)}
                        className="h-7 flex-1 border-border bg-card text-sm"
                        autoFocus
                        disabled={saving}
                      />
                      <Button type="submit" size="sm" className="h-7 px-2 text-xs" disabled={saving || !editingTagValue.trim()}>
                        {t("tags.save")}
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTag(null)
                          setEditingTagValue("")
                        }}
                        className="p-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  ) : (
                    <>
                      <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                        {tag}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTag(tag)
                            setEditingTagValue(tag)
                          }}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(tag)}
                          className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            {allTags.filter((tag) => !tagSearch.trim() || tag.toLowerCase().includes(tagSearch.toLowerCase())).length === 0 && (
              <p className="px-3 py-6 text-center text-xs text-muted-foreground">{t("settings.no_results")}</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}

interface SecuritySectionProps {
  saving: boolean
  message: { type: "success" | "error"; text: string } | null
  newPassword: string
  confirmPassword: string
  onPasswordChange: (field: "new" | "confirm", value: string) => void
  onSave: () => void
}

function SecuritySection({
  saving,
  message,
  newPassword,
  confirmPassword,
  onPasswordChange,
  onSave,
}: SecuritySectionProps) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-password" className="text-sm text-foreground">
          {t("settings.new_password")}
        </Label>
        <Input
          id="new-password"
          type="password"
          placeholder={t("settings.min_chars")}
          value={newPassword}
          onChange={(e) => onPasswordChange("new", e.target.value)}
          className="h-11 border-border bg-card text-sm"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-password" className="text-sm text-foreground">
          {t("settings.confirm_password")}
        </Label>
        <Input
          id="confirm-password"
          type="password"
          placeholder={t("settings.reenter_password")}
          value={confirmPassword}
          onChange={(e) => onPasswordChange("confirm", e.target.value)}
          className="h-11 border-border bg-card text-sm"
        />
      </div>

      {message && (
        <p className={`text-sm ${message.type === "success" ? "text-foreground" : "text-destructive"}`}>
          {message.text}
        </p>
      )}

      <Button onClick={onSave} disabled={saving || !newPassword} className="h-11 w-full">
        {saving ? t("settings.updating") : t("settings.update_password")}
      </Button>
    </div>
  )
}

// ── Main component ──────────────────────────────────────────

type SettingsSection = "profile" | "language" | "currency" | "tags" | "security"

interface ProfileSettingsProps {
  onClose?: () => void
}

const SECTIONS: Array<{ id: SettingsSection; label: string; icon: React.ReactNode }> = [
  { id: "profile", label: "Profile", icon: <User className="h-4 w-4" /> },
  { id: "language", label: "Language", icon: <Globe className="h-4 w-4" /> },
  { id: "currency", label: "Currency", icon: <Globe className="h-4 w-4" /> },
  { id: "tags", label: "Tags", icon: <Tag className="h-4 w-4" /> },
  { id: "security", label: "Security", icon: <Lock className="h-4 w-4" /> },
]

export function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const router = useRouter()
  const { t } = useTranslation()
  const {
    displayName,
    globalCurrency,
    preferredLanguage,
    setGlobalCurrency,
    setPreferredLanguage,
    allTags,
    renameTag,
    deleteTag,
    refreshProfile,
  } = useExpenses()

  const [activeSection, setActiveSection] = useState<SettingsSection>("profile")
  const [name, setName] = useState(displayName)
  const [email, setEmail] = useState("")
  const [isOAuthUser, setIsOAuthUser] = useState(false)
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    setName(displayName)

    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setEmail(user.email)
      const provider = user?.app_metadata?.provider
      setIsOAuthUser(!!provider && provider !== "email")
    })
  }, [displayName])

  async function handleSaveProfile() {
    setSaving(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: name.trim(), updated_at: new Date().toISOString() })
        .eq("id", user.id)
      if (error) throw error
      await refreshProfile()
      setMessage({ type: "success", text: t("settings.profile_updated") })
    } catch {
      setMessage({ type: "error", text: t("settings.profile_failed") })
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      setMessage({ type: "error", text: t("settings.password_min") })
      return
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: t("settings.passwords_mismatch") })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setNewPassword("")
      setConfirmPassword("")
      setMessage({ type: "success", text: t("settings.password_updated") })
    } catch {
      setMessage({ type: "error", text: t("settings.password_failed") })
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-56 border-r border-border flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-left text-sm ${
                activeSection === section.id
                  ? "bg-muted text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {section.icon}
              {section.label}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div className="p-3 border-t border-border">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-destructive hover:bg-destructive/10 transition-colors text-left text-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-8 py-10">
          {/* Section title */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground">
              {t(`settings.${activeSection}`)}
            </h1>
          </div>

          {/* Content */}
          {activeSection === "profile" && (
            <ProfileSection
              displayName={name}
              email={email}
              isOAuthUser={isOAuthUser}
              saving={saving}
              message={message}
              onNameChange={setName}
              onSave={handleSaveProfile}
            />
          )}

          {activeSection === "language" && (
            <LanguageSection
              preferredLanguage={preferredLanguage}
              onSelect={setPreferredLanguage}
            />
          )}

          {activeSection === "currency" && (
            <CurrencySection
              globalCurrency={globalCurrency}
              onSelect={setGlobalCurrency}
            />
          )}

          {activeSection === "tags" && (
            <TagsSection
              allTags={allTags}
              saving={saving}
              onRename={renameTag}
              onDelete={deleteTag}
            />
          )}

          {activeSection === "security" && !isOAuthUser && (
            <SecuritySection
              saving={saving}
              message={message}
              newPassword={newPassword}
              confirmPassword={confirmPassword}
              onPasswordChange={(field, value) => {
                if (field === "new") setNewPassword(value)
                else setConfirmPassword(value)
                setMessage(null)
              }}
              onSave={handleChangePassword}
            />
          )}
        </div>
      </div>
    </div>
  )
}
