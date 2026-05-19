'use client'

import { FilterState, Priority, Section } from '@/types'

interface Props {
  filter: FilterState
  setFilter: (f: FilterState) => void
  areas: string[]
}

const SECTIONS: { key: Section | 'all'; label: string }[] = [
  { key: 'all',       label: 'all' },
  { key: 'today',     label: 'today' },
  { key: 'this_week', label: 'this week' },
  { key: 'someday',   label: 'someday' },
]

const PRIORITIES: { key: Priority; label: string; color: string; bg: string; border: string }[] = [
  { key: 'high',   label: '!high',   color: '#e06c6c', bg: 'rgba(224,108,108,0.08)', border: 'rgba(224,108,108,0.2)' },
  { key: 'normal', label: '!normal', color: 'rgba(255,255,255,0.7)', bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.12)' },
  { key: 'low',    label: '!low',    color: 'rgba(255,255,255,0.45)', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
]

function FilterPill({
  active, onClick, children, activeColor, activeBg, activeBorder,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
  activeColor?: string
  activeBg?: string
  activeBorder?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 11px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: 'pointer',
        letterSpacing: '0.04em',
        border: `1px solid ${active ? (activeBorder ?? 'rgba(125,200,125,0.25)') : 'rgba(255,255,255,0.06)'}`,
        background: active ? (activeBg ?? 'rgba(125,200,125,0.08)') : 'rgba(255,255,255,0.03)',
        color: active ? (activeColor ?? 'var(--green)') : 'rgba(255,255,255,0.45)',
        transition: 'all 0.15s',
        boxShadow: active ? `0 0 8px ${activeBg ?? 'rgba(125,200,125,0.06)'}` : 'none',
      }}
    >
      {children}
    </button>
  )
}

export function FilterBar({ filter, setFilter, areas }: Props) {
  const set = (patch: Partial<FilterState>) => setFilter({ ...filter, ...patch })

  return (
    <div style={{ marginBottom: '20px' }}>
      {/* Glass panel wrapper */}
      <div className="glass-panel" style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

        {/* Search row */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(0,0,0,0.2)',
          border: `1px solid ${filter.search ? 'rgba(125,200,125,0.2)' : 'rgba(255,255,255,0.06)'}`,
          borderRadius: '8px',
          padding: '7px 10px',
          transition: 'border-color 0.2s',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '11px', flexShrink: 0 }}>/</span>
          <input
            value={filter.search}
            onChange={e => set({ search: e.target.value })}
            placeholder="search tasks..."
            style={{ flex: 1, fontSize: '12px', fontWeight: 400 }}
            spellCheck={false}
          />
          {filter.search && (
            <button
              onClick={() => set({ search: '' })}
              style={{
                color: 'rgba(255,255,255,0.45)', fontSize: '14px',
                cursor: 'pointer', background: 'none', border: 'none', padding: 0,
                lineHeight: 1,
              }}
            >×</button>
          )}
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center' }}>

          {/* Section */}
          {SECTIONS.map(s => (
            <FilterPill
              key={s.key}
              active={filter.section === s.key}
              onClick={() => set({ section: s.key })}
            >
              {s.label}
            </FilterPill>
          ))}

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', margin: '0 2px', flexShrink: 0 }} />

          {/* Area */}
          {areas.map(area => (
            <FilterPill
              key={area}
              active={filter.area === area}
              onClick={() => set({ area: filter.area === area ? null : area })}
              activeColor="var(--blue)"
              activeBg="rgba(122,176,212,0.08)"
              activeBorder="rgba(122,176,212,0.25)"
            >
              #{area}
            </FilterPill>
          ))}

          {areas.length > 0 && (
            <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', margin: '0 2px', flexShrink: 0 }} />
          )}

          {/* Priority */}
          {PRIORITIES.map(p => (
            <FilterPill
              key={p.key}
              active={filter.priority === p.key}
              onClick={() => set({ priority: filter.priority === p.key ? null : p.key })}
              activeColor={p.color}
              activeBg={p.bg}
              activeBorder={p.border}
            >
              {p.label}
            </FilterPill>
          ))}

          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.08)', margin: '0 2px', flexShrink: 0 }} />

          {/* Completed toggle */}
          <FilterPill
            active={filter.completed === null}
            onClick={() => set({ completed: filter.completed === null ? false : null })}
            activeColor="var(--amber)"
            activeBg="rgba(232,184,75,0.08)"
            activeBorder="rgba(232,184,75,0.2)"
          >
            {filter.completed === null ? 'showing done' : 'hide done'}
          </FilterPill>
        </div>
      </div>
    </div>
  )
}
