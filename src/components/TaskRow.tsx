'use client'

import { useState, useRef, useEffect } from 'react'
import { Task, Section } from '@/types'
import { formatDueDate } from '@/lib/parseTask'

interface Props {
  task: Task
  index: number
  selected: boolean
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
  onMove: (id: string, section: Section) => void
  onClick: () => void
}

const AREA_STYLE: Record<string, { color: string; border: string; bg: string }> = {
  work:     { color: 'var(--blue)',   border: '#2a3d4d', bg: '#0d1f2d' },
  health:   { color: 'var(--green)',  border: 'var(--green-dim)', bg: '#0d1a0d' },
  personal: { color: 'var(--purple)', border: '#2d2540', bg: '#1a1527' },
}

function getAreaStyle(area: string) {
  return AREA_STYLE[area] ?? { color: 'var(--dim)', border: 'var(--muted)', bg: 'var(--surface)' }
}

const SECTIONS: Section[] = ['today', 'this_week', 'someday']

export function TaskRow({ task, index, selected, onComplete, onDelete, onUpdate, onMove, onClick }: Props) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(task.title)
  const [showMove, setShowMove] = useState(false)
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) editRef.current?.focus()
  }, [editing])

  const commitEdit = () => {
    const v = editValue.trim()
    if (v && v !== task.title) onUpdate(task.id, { title: v })
    else setEditValue(task.title)
    setEditing(false)
  }

  const due = task.due_date ? formatDueDate(task.due_date) : null

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: '10px',
        padding: '7px 8px',
        borderBottom: '0.5px solid var(--border)',
        background: selected ? 'var(--surface2)' : 'transparent',
        transition: 'background 0.1s',
        cursor: 'default',
        position: 'relative',
        borderLeft: task.priority === 'high'
          ? '2px solid var(--red)'
          : task.priority === 'low'
          ? '2px solid var(--muted)'
          : '2px solid transparent',
      }}
    >
      {/* Index */}
      <span style={{ color: 'var(--muted)', minWidth: '22px', fontSize: '11px', userSelect: 'none' }}>
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Checkbox */}
      <button
        onClick={e => { e.stopPropagation(); onComplete(task.id) }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: task.completed ? 'var(--green)' : 'var(--dim)',
          padding: 0,
          fontSize: '13px',
          fontFamily: 'inherit',
          flexShrink: 0,
        }}
        title={task.completed ? 'Mark incomplete' : 'Complete'}
      >
        {task.completed ? '[x]' : '[ ]'}
      </button>

      {/* Title */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {editing ? (
          <input
            ref={editRef}
            value={editValue}
            onChange={e => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={e => {
              if (e.key === 'Enter') commitEdit()
              if (e.key === 'Escape') { setEditValue(task.title); setEditing(false) }
              e.stopPropagation()
            }}
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', fontSize: '13px' }}
          />
        ) : (
          <span
            onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}
            style={{
              color: task.completed ? 'var(--dim)' : 'var(--text)',
              textDecoration: task.completed ? 'line-through' : 'none',
              fontSize: '13px',
            }}
          >
            {task.title}
          </span>
        )}
      </div>

      {/* Area tag */}
      {task.area && (() => {
        const s = getAreaStyle(task.area)
        return (
          <span style={{
            fontSize: '11px',
            padding: '1px 7px',
            borderRadius: '2px',
            border: `0.5px solid ${s.border}`,
            background: s.bg,
            color: s.color,
            flexShrink: 0,
          }}>
            #{task.area}
          </span>
        )
      })()}

      {/* Due date */}
      {due && (
        <span style={{
          fontSize: '11px',
          color: due.overdue ? 'var(--red)' : 'var(--dim)',
          flexShrink: 0,
        }}>
          ~{due.label}
        </span>
      )}

      {/* Move section dropdown */}
      {selected && (
        <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); setEditing(true) }}
            style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: '11px', padding: '0 4px', fontFamily: 'inherit' }}
            title="Edit (e)"
          >
            [e]
          </button>

          <div style={{ position: 'relative' }}>
            <button
              onClick={e => { e.stopPropagation(); setShowMove(v => !v) }}
              style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: '11px', padding: '0 4px', fontFamily: 'inherit' }}
              title="Move to section"
            >
              [mv]
            </button>
            {showMove && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '20px',
                  background: 'var(--surface)',
                  border: '0.5px solid var(--border)',
                  borderRadius: '4px',
                  zIndex: 100,
                  overflow: 'hidden',
                }}
              >
                {SECTIONS.map(s => (
                  <button
                    key={s}
                    onClick={e => { e.stopPropagation(); onMove(task.id, s); setShowMove(false) }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '6px 14px',
                      background: task.section === s ? 'var(--surface2)' : 'none',
                      border: 'none',
                      color: task.section === s ? 'var(--green)' : 'var(--text)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id) }}
            style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: '11px', padding: '0 4px', fontFamily: 'inherit' }}
            title="Delete (d)"
          >
            [del]
          </button>
        </div>
      )}
    </div>
  )
}
