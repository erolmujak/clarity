"use client"

import React from "react"

import { useState, useRef, useCallback, useEffect } from "react"
import { X } from "lucide-react"
import { useExpenses } from "@/lib/expense-context"
import { useTranslation } from "@/lib/i18n"

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const { allTags } = useExpenses()
  const { t } = useTranslation()
  const [input, setInput] = useState("")
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const normalizedTags = tags.map((t) => t.toLowerCase())
  const suggestions = input.trim().length > 0
    ? allTags.filter(
        (tag) =>
          tag.toLowerCase().includes(input.toLowerCase().trim()) &&
          !normalizedTags.includes(tag.toLowerCase()),
      )
    : allTags.filter((tag) => !normalizedTags.includes(tag.toLowerCase()))

  const addTag = useCallback(
    (tag: string) => {
      const normalized = tag.trim().toLowerCase()
      if (normalized && !tags.includes(normalized)) {
        onChange([...tags, normalized])
      }
      setInput("")
      setHighlightIndex(-1)
      inputRef.current?.focus()
    },
    [tags, onChange],
  )

  const removeTag = useCallback(
    (tag: string) => {
      onChange(tags.filter((t) => t !== tag))
      inputRef.current?.focus()
    },
    [tags, onChange],
  )

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (highlightIndex >= 0 && suggestions[highlightIndex]) {
        addTag(suggestions[highlightIndex])
      } else if (input.trim()) {
        addTag(input)
      }
    } else if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1])
    } else if (e.key === "ArrowDown") {
      e.preventDefault()
      setHighlightIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev,
      )
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setHighlightIndex((prev) => (prev > 0 ? prev - 1 : -1))
    } else if (e.key === "Escape") {
      setShowSuggestions(false)
      setHighlightIndex(-1)
    }
  }

  // Close suggestions on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false)
        setHighlightIndex(-1)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <div
        className="flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 transition-colors focus-within:border-foreground/30"
        onClick={() => inputRef.current?.focus()}
        onKeyDown={() => {}}
        role="group"
        aria-label={t("tags.label")}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs text-foreground"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-foreground/10"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setShowSuggestions(true)
            setHighlightIndex(-1)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? t("tags.placeholder") : ""}
          className="min-w-[80px] flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          aria-autocomplete="list"
          aria-expanded={showSuggestions && suggestions.length > 0}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-40 w-full overflow-auto rounded-md border border-border bg-card shadow-md">
          {suggestions.slice(0, 8).map((tag, i) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                addTag(tag)
              }}
              className={`flex w-full items-center px-3 py-2 text-left text-sm transition-colors ${
                i === highlightIndex
                  ? "bg-muted text-foreground"
                  : "text-foreground hover:bg-muted/50"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
