'use client'

import { useMemo } from 'react'

interface Cell {
  date: string
  count: number
  level: 0 | 1 | 2 | 3 | 4
}

interface Props {
  cells: Cell[]
  streak: { current: number; longest: number }
  todayCount: number
  todayDone: number
}

const MONTHS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
const DAYS   = ['s','m','t','w','t','f','s']

const HEAT_COLORS = [
  'rgba(255,255,255,0.04)',
  '#2d4d2d',
  '#3d6e3d',
  '#5a9e5a',
  '#7dc87d',
]

export function Heatmap({ cells, streak, todayCount, todayDone }: Props) {
  const weeks = useMemo(() => {
    const w: Cell[][] = []
    for (let i = 0; i < cells.length; i += 7) w.push(cells.slice(i, i + 7))
    return w
  }, [cells])

  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, wi) => {
      const first = week.find(c => c)
      if (!first) return
      const m = new Date(first.date).getMonth()
      if (m !== lastMonth) { labels.push({ label: MONTHS[m], col: wi }); lastMonth = m }
    })
    return labels
  }, [weeks])

  return (
    <div className="glass-panel" style={{ marginBottom: '20px', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '11px', fontWeight: 600,
          color: 'rgba(255,255,255,0.72)',
          letterSpacing: '0.07em', textTransform: 'uppercase',
        }}>
          Activity
        </span>
        <div style={{ display: 'flex', gap: '16px', fontSize: '11px', fontWeight: 500 }}>
          <span>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>{streak.current}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}> day streak</span>
          </span>
          <span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>best </span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{streak.longest}</span>
          </span>
          <span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>today </span>
            <span style={{ color: 'var(--green)', fontWeight: 600 }}>{todayDone}</span>
            <span style={{ color: 'rgba(255,255,255,0.4)' }}>/{todayCount + todayDone}</span>
          </span>
        </div>
      </div>

      {/* Month labels */}
      <div style={{ display: 'flex', marginBottom: '2px', paddingLeft: '20px' }}>
        {weeks.map((_, wi) => {
          const label = monthLabels.find(l => l.col === wi)
          return (
            <div
              key={wi}
              style={{
                width: `${100 / weeks.length}%`,
                fontSize: '10px',
                color: 'rgba(255,255,255,0.3)',
                whiteSpace: 'nowrap',
                overflow: 'visible',
                fontWeight: 500,
              }}
            >
              {label?.label ?? ''}
            </div>
          )
        })}
      </div>

      {/* Grid */}
      <div style={{ display: 'flex', gap: '2px' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px' }}>
          {DAYS.map((d, i) => (
            <div
              key={i}
              style={{
                width: '10px', height: '10px',
                fontSize: '9px', color: 'rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                lineHeight: 1, fontWeight: 500,
              }}
            >
              {i % 2 === 1 ? d : ''}
            </div>
          ))}
        </div>

        {/* Cells */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
            {week.map((cell, di) => (
              <div
                key={di}
                title={`${cell.date}: ${cell.count} completed`}
                style={{
                  height: '10px',
                  borderRadius: '2px',
                  background: HEAT_COLORS[cell.level],
                  cursor: 'default',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.transform = 'scale(1.4)'
                  el.style.zIndex = '10'
                  el.style.position = 'relative'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.transform = 'scale(1)'
                  el.style.zIndex = '0'
                }}
              />
            ))}
            {Array.from({ length: 7 - week.length }).map((_, i) => (
              <div key={`pad-${i}`} style={{ height: '10px' }} />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>less</span>
        {([0,1,2,3,4] as const).map(l => (
          <div
            key={l}
            style={{
              width: '10px', height: '10px',
              borderRadius: '2px',
              background: HEAT_COLORS[l],
            }}
          />
        ))}
        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>more</span>
      </div>
    </div>
  )
}
