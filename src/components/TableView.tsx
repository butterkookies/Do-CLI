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
const SECTION_ORDER: Record<string, number> = { today: 0, this_week: 1, someday: 2 }

export function TableView({ tasks, subTaskMap, selectedId, onSelect, onComplete, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('section')
  const [sortDir, setSortDir] = useState<1 | -1>(1)

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(key); setSortDir(1) }
  }

  const sorted = [...tasks].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'title') cmp = a.title.localeCompare(b.title)
    else if (sortKey === 'area') cmp = (a.area ?? '').localeCompare(b.area ?? '')
    else if (sortKey === 'due_date') cmp = (a.due_date ?? 'z').localeCompare(b.due_date ?? 'z')
    else if (sortKey === 'priority') cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    else if (sortKey === 'section') cmp = SECTION_ORDER[a.section] - SECTION_ORDER[b.section]
    else if (sortKey === 'completed') cmp = Number(a.completed) - Number(b.completed)
    return cmp * sortDir
  })

  const Th = ({ k, label, width }: { k: SortKey; label: string; width?: string }) => (
    <th
      onClick={() => handleSort(k)}
      style={{
        textAlign: 'left', fontSize: '10px', letterSpacing: '0.08em', textTransform: 'uppercase',
        color: sortKey === k ? 'var(--green)' : 'var(--dim)',
        padding: '6px 10px', cursor: 'pointer', userSelect: 'none',
        borderBottom: '0.5px solid var(--border)', fontWeight: 400, width,
      }}
    >
      {label}{sortKey === k ? (sortDir === 1 ? ' ↑' : ' ↓') : ''}
    </th>
  )

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ width: '32px', borderBottom: '0.5px solid var(--border)', padding: '6px 10px' }} />
            <Th k="completed" label="done" width="52px" />
            <Th k="title" label="title" />
            <Th k="area" label="area" width="90px" />
            <Th k="due_date" label="due" width="100px" />
            <Th k="priority" label="pri" width="70px" />
            <Th k="section" label="section" width="90px" />
            <th style={{ borderBottom: '0.5px solid var(--border)', padding: '6px 10px', width: '60px' }} />
          </tr>
        </thead>
        <tbody>
          {sorted.map((task, i) => {
            const due = task.due_date ? formatDueDate(task.due_date) : null
            const isSelected = task.id === selectedId
            const subs = subTaskMap.get(task.id) ?? []
            const subDone = subs.filter(t => t.completed).length

            return (
              <tr
                key={task.id}
                onClick={() => onSelect(task.id)}
                style={{
                  background: isSelected ? 'var(--surface2)' : 'transparent',
                  cursor: 'default',
                  borderLeft: task.priority === 'high'
                    ? '2px solid var(--red)'
                    : task.priority === 'low'
                    ? '2px solid var(--muted)'
                    : '2px solid transparent',
                }}
              >
                <td style={{ padding: '6px 10px', color: 'var(--muted)', fontSize: '10px', borderBottom: '0.5px solid var(--border)' }}>
                  {String(i + 1).padStart(2, '0')}
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)' }}>
                  <button
                    onClick={e => { e.stopPropagation(); onComplete(task.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: task.completed ? 'var(--green)' : 'var(--dim)', fontFamily: 'inherit', fontSize: '12px', padding: 0 }}
                  >
                    {task.completed ? '[x]' : '[ ]'}
                  </button>
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)' }}>
                  <span style={{ fontSize: '12px', color: task.completed ? 'var(--dim)' : 'var(--text)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                    {task.title}
                  </span>
                  {task.recurring && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--amber)' }}>↻</span>}
                  {subs.length > 0 && <span style={{ marginLeft: '6px', fontSize: '10px', color: 'var(--dim)' }}>{subDone}/{subs.length}</span>}
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)', fontSize: '11px', color: 'var(--blue)' }}>
                  {task.area ? `#${task.area}` : ''}
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)', fontSize: '11px', color: due?.overdue ? 'var(--red)' : 'var(--dim)' }}>
                  {due ? `~${due.label}` : ''}
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)', fontSize: '11px' }}>
                  <span style={{ color: task.priority === 'high' ? 'var(--red)' : task.priority === 'low' ? 'var(--muted)' : 'var(--dim)' }}>
                    !{task.priority}
                  </span>
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)', fontSize: '11px', color: 'var(--dim)' }}>
                  {task.section.replace('_', ' ')}
                </td>
                <td style={{ padding: '6px 10px', borderBottom: '0.5px solid var(--border)' }}>
                  {isSelected && (
                    <button
                      onClick={e => { e.stopPropagation(); onDelete(task.id) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: '11px', fontFamily: 'inherit', padding: 0 }}
                    >
                      [del]
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div style={{ color: 'var(--muted)', fontSize: '12px', fontStyle: 'italic', padding: '16px 10px' }}>— no tasks</div>
      )}
    </div>
  )
}
