'use client'

import { useState } from 'react'
import { Task, Section } from '@/types'
import { formatDueDate } from '@/lib/parseTask'

type SortKey = 'title' | 'area' | 'due_date' | 'priority' | 'section' | 'completed'

interface Props {
  tasks: Task[]
  subTaskMap: Map<string, Task[]>
  selectedId: string | null
  onSelect: (id: string) => void
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onMove: (id: string, section: Section) => void
}

const PRIORITY_ORDER: Record<string, number> = { high: 0, normal: 1, low: 2 }
const SECTION_ORDER: Record<string, number>  = { today: 0, this_week: 1, someday: 2 }

export function TableView({ tasks, subTaskMap, selectedId, onSelect, onComplete, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('section')
  const [sortDir, setSortDir] = useState<1 | -1>(1)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(key); setSortDir(1) }
  }

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'title')     cmp = a.title.localeCompare(b.title)
    else if (sortKey === 'area') cmp = (a.area ?? '').localeCompare(b.area ?? '')
    else if (sortKey === 'due_date') cmp = (a.due_date ?? 'z').localeCompare(b.due_date ?? 'z')
    else if (sortKey === 'priority') cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    else if (sortKey === 'section')  cmp = SECTION_ORDER[a.section]  - SECTION_ORDER[b.section]
    else if (sortKey === 'completed') cmp = Number(a.completed) - Number(b.completed)
    return cmp * sortDir
  })

  const Th = ({ k, label, width }: { k: SortKey; label: string; width?: string }) => {
    const active = sortKey === k
    return (
      <th
        onClick={() => handleSort(k)}
        style={{
          textAlign: 'left',
          fontSize: '10px', fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: active ? 'var(--green)' : 'rgba(255,255,255,0.4)',
          padding: '10px 12px',
          cursor: 'pointer', userSelect: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          width,
          textShadow: active ? '0 0 8px rgba(125,200,125,0.2)' : 'none',
          transition: 'color 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        {active && (
          <span style={{ marginLeft: '4px', opacity: 0.7 }}>
            {sortDir === 1 ? '↑' : '↓'}
          </span>
        )}
      </th>
    )
  }

  return (
    <div className="glass-panel" style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{
              width: '32px', padding: '10px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }} />
            <Th k="completed" label="done"    width="52px" />
            <Th k="title"     label="title" />
            <Th k="area"      label="area"     width="90px" />
            <Th k="due_date"  label="due"      width="100px" />
            <Th k="priority"  label="pri"      width="70px" />
            <Th k="section"   label="section"  width="90px" />
            <th style={{
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              padding: '10px 12px', width: '60px',
            }} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((task, i) => {
            const due = task.due_date ? formatDueDate(task.due_date) : null
            const isSelected = task.id === selectedId
            const subs = subTaskMap.get(task.id) ?? []
            const subDone = subs.filter(t => t.completed).length

            const priColor = task.priority === 'high' ? '#e06c6c'
              : task.priority === 'low' ? 'rgba(255,255,255,0.18)'
              : 'transparent'

            return (
              <tr
                key={task.id}
                onClick={() => onSelect(task.id)}
                style={{
                  background: isSelected ? 'rgba(125,200,125,0.05)' : 'transparent',
                  cursor: 'default',
                  borderLeft: `2px solid ${priColor}`,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Row number */}
                <td style={{ padding: '7px 12px', color: 'rgba(255,255,255,0.2)', fontSize: '10px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {String(i + 1).padStart(2, '0')}
                </td>

                {/* Checkbox */}
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <button
                    onClick={e => { e.stopPropagation(); onComplete(task.id) }}
                    style={{
                      width: '14px', height: '14px', borderRadius: '4px',
                      border: `1.5px solid ${task.completed ? '#7dc87d' : 'rgba(255,255,255,0.15)'}`,
                      background: task.completed ? '#7dc87d' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '9px', color: '#0d0d0d',
                      boxShadow: task.completed ? '0 0 5px rgba(125,200,125,0.3)' : 'none',
                      transition: 'all 0.15s',
                    }}
                  >
                    {task.completed && '✓'}
                  </button>
                </td>

                {/* Title */}
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{
                    fontSize: '13px', fontWeight: 500,
                    color: task.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.88)',
                    textDecoration: task.completed ? 'line-through' : 'none',
                  }}>
                    {task.title}
                  </span>
                  {task.recurring && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--amber)' }}>↻</span>}
                  {subs.length > 0 && (
                    <span style={{
                      marginLeft: '6px', fontSize: '10px',
                      color: 'rgba(255,255,255,0.35)',
                      background: 'rgba(255,255,255,0.04)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: '3px', padding: '0 4px',
                    }}>
                      {subDone}/{subs.length}
                    </span>
                  )}
                </td>

                {/* Area */}
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '11px', fontWeight: 500 }}>
                  {task.area && (
                    <span style={{
                      color: 'var(--blue)',
                      padding: '2px 5px', borderRadius: '4px',
                      border: '1px solid rgba(122,176,212,0.15)',
                      background: 'rgba(122,176,212,0.06)',
                    }}>
                      #{task.area}
                    </span>
                  )}
                </td>

                {/* Due */}
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '11px', fontWeight: 500 }}>
                  {due && (
                    <span style={{ color: due.overdue ? 'var(--red)' : 'rgba(255,255,255,0.45)' }}>
                      ~{due.label}
                    </span>
                  )}
                </td>

                {/* Priority */}
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '11px', fontWeight: 600 }}>
                  <span style={{
                    color: task.priority === 'high' ? 'var(--red)'
                      : task.priority === 'low'  ? 'rgba(255,255,255,0.25)'
                      : 'rgba(255,255,255,0.4)',
                  }}>
                    !{task.priority}
                  </span>
                </td>

                {/* Section */}
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.45)' }}>
                  {task.section.replace('_', ' ')}
                </td>

                {/* Actions */}
                <td style={{ padding: '7px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  {isSelected && (
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(task.id) }}
                      style={{
                        background: 'rgba(224,108,108,0.08)',
                        border: '1px solid rgba(224,108,108,0.15)',
                        borderRadius: '4px', cursor: 'pointer',
                        color: 'var(--red)', fontSize: '10px', fontWeight: 600,
                        padding: '2px 6px', fontFamily: 'inherit',
                      }}
                    >
                      del
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px', fontStyle: 'italic', padding: '16px 12px' }}>
          — no tasks
        </div>
      )}
    </div>
  )
}
