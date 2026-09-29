'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { globalSearch, type SearchResult } from '@/lib/actions/search'

export function GlobalSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    const timer = setTimeout(() => {
      startTransition(async () => {
        const found = await globalSearch(q)
        setResults(found)
      })
    }, 250)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function goTo(href: string) {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder="Search landlords, properties, tenants…"
        className="w-full px-3.5 py-2 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute z-10 mt-1.5 w-full bg-panel border border-line rounded-md shadow-lg overflow-hidden">
          {pending ? (
            <p className="text-sm text-ink-soft px-3.5 py-2.5">Searching…</p>
          ) : results.length === 0 ? (
            <p className="text-sm text-ink-soft px-3.5 py-2.5">No matches for &ldquo;{query}&rdquo;.</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li key={`${r.type}:${r.id}`}>
                  <button
                    type="button"
                    onClick={() => goTo(r.href)}
                    className="w-full text-left px-3.5 py-2.5 hover:bg-bone/60 border-b border-line last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm text-ink font-medium truncate">{r.label}</span>
                      <span className="text-[10px] uppercase tracking-wide text-ink-soft border border-line rounded px-1.5 py-0.5 flex-shrink-0">
                        {r.typeLabel}
                      </span>
                    </div>
                    {r.sublabel && <p className="text-xs text-ink-soft truncate mt-0.5">{r.sublabel}</p>}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
