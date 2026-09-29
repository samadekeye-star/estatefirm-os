'use client'

import { useMemo, useState } from 'react'

export type DocumentRow = {
  id: string
  fileName: string
  aboutLabel: string
  tagLabel: string
  createdAt: string
  url: string | null
}

export function DocumentsTable({ rows }: { rows: DocumentRow[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(
      (r) =>
        r.fileName.toLowerCase().includes(q) ||
        r.aboutLabel.toLowerCase().includes(q) ||
        r.tagLabel.toLowerCase().includes(q)
    )
  }, [rows, query])

  return (
    <div className="bg-panel border border-line rounded-xl overflow-hidden">
      <div className="p-4 border-b border-line">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by file name, tag, or who it's about…"
          className="w-full px-3.5 py-2.5 border border-line rounded-md text-sm bg-panel focus:outline-none focus:ring-2 focus:ring-brass/40"
        />
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-ink-soft p-5">No documents yet — upload the first one above.</p>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ink-soft p-5">No documents match &ldquo;{query}&rdquo;.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-ink-soft uppercase tracking-wide">
              <th className="px-5 py-3 font-medium">File</th>
              <th className="px-5 py-3 font-medium">About</th>
              <th className="px-5 py-3 font-medium">Type</th>
              <th className="px-5 py-3 font-medium">Uploaded</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-line last:border-b-0">
                <td className="px-5 py-3 text-ink font-medium">{d.fileName}</td>
                <td className="px-5 py-3 text-ink-soft">{d.aboutLabel}</td>
                <td className="px-5 py-3">
                  <span className="text-xs uppercase tracking-wide font-medium px-2 py-0.5 rounded bg-brass/10 text-brass-deep">
                    {d.tagLabel}
                  </span>
                </td>
                <td className="px-5 py-3 text-ink-soft">{d.createdAt.slice(0, 10)}</td>
                <td className="px-5 py-3 text-right">
                  {d.url ? (
                    <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-brass-deep font-medium">
                      Download
                    </a>
                  ) : (
                    <span className="text-ink-soft">Link unavailable</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
