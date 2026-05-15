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
const DAYS = ['s','m','t','w','t','f','s']

export function Heatmap({ cells, streak, todayCount, todayDone }: Props) {
  // Group into weeks (columns)
  const weeks = useMemo(() => {
    const w: Cell[][] = []
    for (let i = 0; i < cells.length; i += 7) {
      w.push(cells.slice(i, i + 7))
    }
    return w
  }, [cells])

  // Month labels: find first cell of each month
  const monthLabels = useMemo(() => {
    const labels: { label: string; col: number }[] = []
    let lastMonth = -1
    weeks.forEach((week, wi) => {
      const first = week.find(c => c)
      if (!first) return
      const m = new Date(first.date).getMonth()
      if (m !== lastMonth) {
        labels.push({ label: MONTHS[m], col: wi })
        lastMonth = m
      }
    })
    return labels
  }, [weeks])

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span style={{ color: 'var(--dim)', fontSize: '11px', letterSpacing: '0.08em' }}>
          ACTIVITY
        </span>
        <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: 'var(--dim)' }}>
          <span>
            <span style={{ color: 'var(--text)' }}>{streak.current}</span> day streak
          </span>
          <span>
            best <span style={{ color: 'var(--text)' }}>{streak.longest}</span>
          </span>
          <span>
            today <span style={{ color: 'var(--green)' }}>{todayDone}</span>
            <span>/{todayCount + todayDone}</span>
          </span>
        </div>
      </div>

      {/* Month labels */}
      <div style={{ display: 'flex', marginBottom: '4px', paddingLeft: '20px' }}>
        {weeks.map((_, wi) => {
          const label = monthLabels.find(l => l.col === wi)
          return (
            <div
              key={wi}
              style={{
                width: `${100 / weeks.length}%`,
                fontSize: '10px',
                color: 'var(--dim)',
                whiteSpace: 'nowrap',
                overflow: 'visible',
              }}
            >
              {label?.label ?? ''}
            </div>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: '2px' }}>
        {/* Day labels */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginRight: '4px' }}>
          {DAYS.map((d, i) => (
            <div
              key={i}
              style={{
                width: '10px',
                height: '10px',
                fontSize: '9px',
                color: 'var(--dim)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              {i % 2 === 1 ? d : ''}
            </div>
          ))}
        </div>

        {/* Grid */}
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
            {week.map((cell, di) => (
              <div
                key={di}
                className={`hm-${cell.level}`}
                title={`${cell.date}: ${cell.count} completed`}
                style={{
                  height: '10px',
                  borderRadius: '2px',
                  cursor: 'default',
                  transition: 'opacity 0.1s',
                }}
              />
            ))}
            {/* Pad weeks shorter than 7 */}
            {Array.from({ length: 7 - week.length }).map((_, i) => (
              <div key={`pad-${i}`} style={{ height: '10px' }} />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', justifyContent: 'flex-end' }}>
        <span style={{ fontSize: '10px', color: 'var(--dim)' }}>less</span>
        {([0,1,2,3,4] as const).map(l => (
          <div key={l} className={`hm-${l}`} style={{ width: '10px', height: '10px', borderRadius: '2px' }} />
        ))}
        <span style={{ fontSize: '10px', color: 'var(--dim)' }}>more</span>
      </div>
    </div>
  )
}
