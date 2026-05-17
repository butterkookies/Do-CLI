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
  subTasks?: Task[]
  onAddSubTask?: (parentId: string, title: string) => void
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

export function TaskRow({ task, index, selected, onComplete, onDelete, onUpdate, onMove, onClick, subTasks = [], onAddSubTask }: Props) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(task.title)
  const [showMove, setShowMove] = useState(false)
  const [showSubInput, setShowSubInput] = useState(false)
  const [subInputValue, setSubInputValue] = useState('')
  const [subExpanded, setSubExpanded] = useState(true)
  const editRef = useRef<HTMLInputElement>(null)
  const subInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) editRef.current?.focus()
  }, [editing])

  useEffect(() => {
    if (showSubInput) subInputRef.current?.focus()
  }, [showSubInput])

  const commitEdit = () => {
    const v = editValue.trim()
    if (v && v !== task.title) onUpdate(task.id, { title: v })
    else setEditValue(task.title)
    setEditing(false)
  }

  const commitSubTask = () => {
    if (subInputValue.trim() && onAddSubTask) {
      onAddSubTask(task.id, subInputValue.trim())
    }
    setSubInputValue('')
    setShowSubInput(false)
  }

  const due = task.due_date ? formatDueDate(task.due_date) : null
  const subDone = subTasks.filter(t => t.completed).length

  return (
    <>
      <div
        onClick={onClick}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '10px',
          padding: '7px 8px',
          borderBottom: subTasks.length > 0 && subExpanded ? 'none' : '0.5px solid var(--border)',
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
        <span style={{ color: 'var(--muted)', minWidth: '22px', fontSize: '11px', userSelect: 'none' }}>
          {String(index + 1).padStart(2, '0')}
        </span>

        <button
          onClick={e => { e.stopPropagation(); onComplete(task.id) }}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: task.completed ? 'var(--green)' : 'var(--dim)',
            padding: 0, fontSize: '13px', fontFamily: 'inherit', flexShrink: 0,
          }}
          title={task.completed ? 'Mark incomplete' : 'Complete'}
        >
          {task.completed ? '[x]' : '[ ]'}
        </button>

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

        {task.recurring && (
          <span style={{ fontSize: '10px', color: 'var(--amber)', flexShrink: 0 }} title={`repeats ${task.recurring}`}>↻</span>
        )}

        {subTasks.length > 0 && !selected && (
          <button
            onClick={e => { e.stopPropagation(); setSubExpanded(v => !v) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '10px', padding: 0, fontFamily: 'inherit', flexShrink: 0 }}
          >
            {subDone}/{subTasks.length} {subExpanded ? '▾' : '▸'}
          </button>
        )}

        {task.area && (() => {
          const s = getAreaStyle(task.area)
          return (
            <span style={{
              fontSize: '11px', padding: '1px 7px', borderRadius: '2px',
              border: `0.5px solid ${s.border}`, background: s.bg, color: s.color, flexShrink: 0,
            }}>
              #{task.area}
            </span>
          )
        })()}

        {due && (
          <span style={{ fontSize: '11px', color: due.overdue ? 'var(--red)' : 'var(--dim)', flexShrink: 0 }}>
            ~{due.label}
          </span>
        )}

        {selected && (
          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
            <button
              onClick={e => { e.stopPropagation(); setEditing(true) }}
              style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: '11px', padding: '0 4px', fontFamily: 'inherit' }}
              title="Edit (e)"
            >
              [e]
            </button>

            {onAddSubTask && (
              <button
                onClick={e => { e.stopPropagation(); setShowSubInput(v => !v); setSubExpanded(true) }}
                style={{ background: 'none', border: 'none', color: 'var(--amber)', cursor: 'pointer', fontSize: '11px', padding: '0 4px', fontFamily: 'inherit' }}
                title="Add sub-task"
              >
                [+sub]
              </button>
            )}

            <div style={{ position: 'relative' }}>
              <button
                onClick={e => { e.stopPropagation(); setShowMove(v => !v) }}
                style={{ background: 'none', border: 'none', color: 'var(--dim)', cursor: 'pointer', fontSize: '11px', padding: '0 4px', fontFamily: 'inherit' }}
                title="Move to section"
              >
                [mv]
              </button>
              {showMove && (
                <div style={{
                  position: 'absolute', right: 0, top: '20px',
                  background: 'var(--surface)', border: '0.5px solid var(--border)',
                  borderRadius: '4px', zIndex: 100, overflow: 'hidden',
                }}>
                  {SECTIONS.map(s => (
                    <button
                      key={s}
                      onClick={e => { e.stopPropagation(); onMove(task.id, s); setShowMove(false) }}
                      style={{
                        display: 'block', width: '100%', padding: '6px 14px',
                        background: task.section === s ? 'var(--surface2)' : 'none',
                        border: 'none', color: task.section === s ? 'var(--green)' : 'var(--text)',
                        cursor: 'pointer', fontSize: '12px', textAlign: 'left', fontFamily: 'inherit',
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

      {/* Sub-tasks */}
      {subExpanded && subTasks.map((sub, si) => (
        <div
          key={sub.id}
          style={{
            display: 'flex', alignItems: 'baseline', gap: '10px',
            padding: '5px 8px 5px 44px',
            borderBottom: si === subTasks.length - 1 && !showSubInput ? '0.5px solid var(--border)' : 'none',
            background: 'transparent',
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); onComplete(sub.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: sub.completed ? 'var(--green)' : 'var(--muted)', fontSize: '12px', padding: 0, fontFamily: 'inherit', flexShrink: 0 }}
          >
            {sub.completed ? '[x]' : '[ ]'}
          </button>
          <span style={{ fontSize: '12px', color: sub.completed ? 'var(--muted)' : 'var(--dim)', textDecoration: sub.completed ? 'line-through' : 'none', flex: 1 }}>
            {sub.title}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onDelete(sub.id) }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '10px', padding: 0, fontFamily: 'inherit', flexShrink: 0 }}
          >
            ×
          </button>
        </div>
      ))}

      {/* Sub-task input */}
      {showSubInput && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '5px 8px 5px 44px',
          borderBottom: '0.5px solid var(--border)',
          background: 'var(--surface)',
        }}>
          <span style={{ color: 'var(--amber)', fontSize: '11px', userSelect: 'none' }}>›</span>
          <input
            ref={subInputRef}
            value={subInputValue}
            onChange={e => setSubInputValue(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') commitSubTask()
              if (e.key === 'Escape') { setSubInputValue(''); setShowSubInput(false) }
              e.stopPropagation()
            }}
            onClick={e => e.stopPropagation()}
            placeholder="add sub-task..."
            style={{ flex: 1, fontSize: '12px' }}
          />
        </div>
      )}
    </>
  )
}
