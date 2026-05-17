'use client'

import { FilterState, Priority, Section } from '@/types'

interface Props {
  filter: FilterState
  setFilter: (f: FilterState) => void
  areas: string[]
}

const SECTIONS: { key: Section | 'all'; label: string }[] = [
  { key: 'all', label: 'all' },
  { key: 'today', label: 'today' },
  { key: 'this_week', label: 'this week' },
  { key: 'someday', label: 'someday' },
]

const PRIORITIES: { key: Priority; label: string }[] = [
  { key: 'high', label: '!high' },
  { key: 'normal', label: '!normal' },
  { key: 'low', label: '!low' },
]

export function FilterBar({ filter, setFilter, areas }: Props) {
  const set = (patch: Partial<FilterState>) => setFilter({ ...filter, ...patch })

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Search */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '0.5px solid var(--border)',
          borderRadius: '4px',
          padding: '6px 10px',
          background: 'var(--surface)',
          marginBottom: '10px',
        }}
      >
        <span style={{ color: 'var(--dim)', fontSize: '11px' }}>/</span>
        <input
          value={filter.search}
          onChange={e => set({ search: e.target.value })}
          placeholder="search tasks..."
          style={{ flex: 1, fontSize: '12px' }}
          spellCheck={false}
        />
        {filter.search && (
          <button
            onClick={() => set({ search: '' })}
            style={{ color: 'var(--dim)', fontSize: '11px', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
          >
            ×
          </button>
        )}
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => set({ section: s.key })}
            style={{
              padding: '3px 10px',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer',
              border: '0.5px solid',
              borderColor: filter.section === s.key ? 'var(--green)' : 'var(--border)',
              background: filter.section === s.key ? 'var(--green-dim)' : 'transparent',
              color: filter.section === s.key ? 'var(--green)' : 'var(--dim)',
              transition: 'all 0.1s',
            }}
          >
            {s.label}
          </button>
        ))}

        <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />

        {/* Area filters */}
        {areas.map(area => (
          <button
            key={area}
            onClick={() => set({ area: filter.area === area ? null : area })}
            style={{
              padding: '3px 10px',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer',
              border: '0.5px solid',
              borderColor: filter.area === area ? 'var(--blue)' : 'var(--border)',
              background: filter.area === area ? '#0d1f2d' : 'transparent',
              color: filter.area === area ? 'var(--blue)' : 'var(--dim)',
              transition: 'all 0.1s',
            }}
          >
            #{area}
          </button>
        ))}

        <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />

        {/* Priority filters */}
        {PRIORITIES.map(p => (
          <button
            key={p.key}
            onClick={() => set({ priority: filter.priority === p.key ? null : p.key })}
            style={{
              padding: '3px 10px',
              borderRadius: '3px',
              fontSize: '11px',
              cursor: 'pointer',
              border: '0.5px solid',
              borderColor: filter.priority === p.key
                ? p.key === 'high' ? 'var(--red)' : 'var(--border)'
                : 'var(--border)',
              background: filter.priority === p.key
                ? p.key === 'high' ? '#2d0d0d' : 'var(--surface2)'
                : 'transparent',
              color: filter.priority === p.key
                ? p.key === 'high' ? 'var(--red)' : 'var(--text)'
                : 'var(--dim)',
              transition: 'all 0.1s',
            }}
          >
            {p.label}
          </button>
        ))}

        <div style={{ width: '1px', background: 'var(--border)', margin: '0 4px' }} />

        {/* Show completed toggle */}
        <button
          onClick={() => set({ completed: filter.completed === null ? false : null })}
          style={{
            padding: '3px 10px',
            borderRadius: '3px',
            fontSize: '11px',
            cursor: 'pointer',
            border: '0.5px solid',
            borderColor: filter.completed === null ? 'var(--amber)' : 'var(--border)',
            background: filter.completed === null ? '#2d2200' : 'transparent',
            color: filter.completed === null ? 'var(--amber)' : 'var(--dim)',
            transition: 'all 0.1s',
          }}
        >
          {filter.completed === null ? 'showing done' : 'hide done'}
        </button>
      </div>
    </div>
  )
}
