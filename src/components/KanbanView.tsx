'use client'

import { useState } from 'react'
import { Task, Section } from '@/types'
import { formatDueDate } from '@/lib/parseTask'

interface Props {
  tasks: Task[]
  subTaskMap: Map<string, Task[]>
  selectedId: string | null
  onSelect: (id: string) => void
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onMove: (id: string, section: Section) => void
}

const COLUMNS: { section: Section; label: string }[] = [
  { section: 'today', label: 'today' },
  { section: 'this_week', label: 'this week' },
  { section: 'someday', label: 'someday' },
]

const OTHER_SECTIONS = (current: Section): Section[] =>
  COLUMNS.map(c => c.section).filter(s => s !== current)

export function KanbanView({ tasks, subTaskMap, selectedId, onSelect, onComplete, onDelete, onMove }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', alignItems: 'start' }}>
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.section === col.section)
        const done = colTasks.filter(t => t.completed).length
        return (
          <div key={col.section}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              borderBottom: '0.5px solid var(--border)',
              paddingBottom: '8px', marginBottom: '10px',
            }}>
              <span style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--dim)' }}>
                {col.label}
              </span>
              <span style={{ color: 'var(--muted)', fontSize: '11px' }}>{done}/{colTasks.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {colTasks.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: '12px', fontStyle: 'italic', padding: '8px 0' }}>— empty</div>
              ) : (
                colTasks.map(task => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    subTasks={subTaskMap.get(task.id) ?? []}
                    selected={task.id === selectedId}
                    onSelect={() => onSelect(task.id)}
                    onComplete={onComplete}
                    onDelete={onDelete}
                    onMove={onMove}
                    otherSections={OTHER_SECTIONS(col.section)}
                  />
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface CardProps {
  task: Task
  subTasks: Task[]
  selected: boolean
  otherSections: Section[]
  onSelect: () => void
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onMove: (id: string, section: Section) => void
}

function KanbanCard({ task, subTasks, selected, otherSections, onSelect, onComplete, onDelete, onMove }: CardProps) {
  const [expanded, setExpanded] = useState(true)
  const due = task.due_date ? formatDueDate(task.due_date) : null
  const subDone = subTasks.filter(t => t.completed).length

  return (
    <div
      onClick={onSelect}
      style={{
        background: selected ? 'var(--surface2)' : 'var(--surface)',
        border: `0.5px solid ${selected ? 'var(--green)' : 'var(--border)'}`,
        borderLeft: task.priority === 'high'
          ? '2px solid var(--red)'
          : task.priority === 'low'
          ? '2px solid var(--muted)'
          : `0.5px solid ${selected ? 'var(--green)' : 'var(--border)'}`,
        borderRadius: '4px',
        padding: '8px 10px',
        cursor: 'default',
        transition: 'all 0.1s',
      }}
    >
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <button
          onClick={e => { e.stopPropagation(); onComplete(task.id) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            color: task.completed ? 'var(--green)' : 'var(--dim)',
            fontSize: '12px', flexShrink: 0, fontFamily: 'inherit', marginTop: '1px',
          }}
        >
          {task.completed ? '[x]' : '[ ]'}
        </button>
        <span style={{
          fontSize: '12px',
          color: task.completed ? 'var(--dim)' : 'var(--text)',
          textDecoration: task.completed ? 'line-through' : 'none',
          flex: 1, wordBreak: 'break-word',
        }}>
          {task.title}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
        {task.area && <span style={{ fontSize: '10px', color: 'var(--blue)' }}>#{task.area}</span>}
        {due && <span style={{ fontSize: '10px', color: due.overdue ? 'var(--red)' : 'var(--dim)' }}>~{due.label}</span>}
        {task.recurring && <span style={{ fontSize: '10px', color: 'var(--amber)' }}>↻{task.recurring}</span>}
        {subTasks.length > 0 && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dim)', fontSize: '10px', padding: 0, fontFamily: 'inherit' }}
          >
            {subDone}/{subTasks.length} sub {expanded ? '▾' : '▸'}
          </button>
        )}
      </div>

      {expanded && subTasks.length > 0 && (
        <div style={{ marginTop: '6px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {subTasks.map(sub => (
            <div key={sub.id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onClick={e => { e.stopPropagation(); onComplete(sub.id) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub.completed ? 'var(--green)' : 'var(--muted)', fontSize: '11px', padding: 0, fontFamily: 'inherit' }}
              >
                {sub.completed ? '[x]' : '[ ]'}
              </button>
              <span style={{ fontSize: '11px', color: sub.completed ? 'var(--muted)' : 'var(--dim)', textDecoration: sub.completed ? 'line-through' : 'none' }}>
                {sub.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
          {otherSections.map(s => (
            <button
              key={s}
              onClick={e => { e.stopPropagation(); onMove(task.id, s) }}
              style={{
                background: 'none', border: '0.5px solid var(--border)', cursor: 'pointer',
                color: 'var(--dim)', fontSize: '10px', padding: '2px 6px',
                borderRadius: '2px', fontFamily: 'inherit',
              }}
            >
              →{s.replace('_', ' ')}
            </button>
          ))}
          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id) }}
            style={{
              background: 'none', border: '0.5px solid var(--border)', cursor: 'pointer',
              color: 'var(--red)', fontSize: '10px', padding: '2px 6px',
              borderRadius: '2px', fontFamily: 'inherit',
            }}
          >
            [del]
          </button>
        </div>
      )}
    </div>
  )
}
