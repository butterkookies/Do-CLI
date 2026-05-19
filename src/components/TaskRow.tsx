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
  work:     { color: 'var(--blue)',   border: 'rgba(122,176,212,0.2)', bg: 'rgba(122,176,212,0.06)' },
  health:   { color: 'var(--green)',  border: 'rgba(125,200,125,0.2)', bg: 'rgba(125,200,125,0.06)' },
  personal: { color: 'var(--purple)', border: 'rgba(179,157,219,0.2)', bg: 'rgba(179,157,219,0.06)' },
}

function getAreaStyle(area: string) {
  return AREA_STYLE[area] ?? { color: 'rgba(255,255,255,0.55)', border: 'rgba(255,255,255,0.12)', bg: 'rgba(255,255,255,0.04)' }
}

const SECTIONS: Section[] = ['today', 'this_week', 'someday']

export function TaskRow({
  task, index, selected, onComplete, onDelete, onUpdate, onMove, onClick,
  subTasks = [], onAddSubTask,
}: Props) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(task.title)
  const [showMove, setShowMove] = useState(false)
  const [showSubInput, setShowSubInput] = useState(false)
  const [subInputValue, setSubInputValue] = useState('')
  const [subExpanded, setSubExpanded] = useState(true)
  const [hovering, setHovering] = useState(false)
  const editRef = useRef<HTMLInputElement>(null)
  const subInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (editing) editRef.current?.focus() }, [editing])
  useEffect(() => { if (showSubInput) subInputRef.current?.focus() }, [showSubInput])

  const commitEdit = () => {
    const v = editValue.trim()
    if (v && v !== task.title) onUpdate(task.id, { title: v })
    else setEditValue(task.title)
    setEditing(false)
  }

  const commitSubTask = () => {
    if (subInputValue.trim() && onAddSubTask) onAddSubTask(task.id, subInputValue.trim())
    setSubInputValue('')
    setShowSubInput(false)
  }

  const due = task.due_date ? formatDueDate(task.due_date) : null
  const subDone = subTasks.filter(t => t.completed).length

  const priColor = task.priority === 'high' ? '#e06c6c'
    : task.priority === 'low' ? 'rgba(255,255,255,0.18)'
    : 'transparent'

  return (
    <>
      <div
        onClick={onClick}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 14px',
          background: selected
            ? 'rgba(125,200,125,0.06)'
            : hovering ? 'rgba(255,255,255,0.02)' : 'transparent',
          boxShadow: selected ? 'inset 0 0 0 1px rgba(125,200,125,0.08)' : 'none',
          transition: 'all 0.15s',
          cursor: 'default',
          position: 'relative',
          borderLeft: `2px solid ${priColor}`,
        }}
      >
        {/* Row number */}
        <span style={{ color: 'rgba(255,255,255,0.2)', minWidth: '20px', fontSize: '10px', userSelect: 'none', flexShrink: 0 }}>
          {String(index + 1).padStart(2, '0')}
        </span>

        {/* Checkbox — widget style */}
        <button
          onClick={e => { e.stopPropagation(); onComplete(task.id) }}
          style={{
            width: '14px', height: '14px',
            borderRadius: '4px',
            border: `1.5px solid ${task.completed ? '#7dc87d' : hovering ? 'rgba(125,200,125,0.5)' : 'rgba(255,255,255,0.15)'}`,
            background: task.completed ? '#7dc87d' : 'transparent',
            flexShrink: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '9px', color: '#0d0d0d',
            boxShadow: task.completed ? '0 0 6px rgba(125,200,125,0.3)' : 'none',
            transition: 'all 0.2s',
          }}
          title={task.completed ? 'Mark incomplete' : 'Complete'}
        >
          {task.completed && '✓'}
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
              style={{ width: '100%', fontSize: '13px', fontWeight: 500 }}
            />
          ) : (
            <span
              onDoubleClick={e => { e.stopPropagation(); setEditing(true) }}
              style={{
                color: task.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.9)',
                textDecoration: task.completed ? 'line-through' : 'none',
                fontSize: '13px', fontWeight: 500,
              }}
            >
              {task.title}
            </span>
          )}
        </div>

        {/* Recurring */}
        {task.recurring && (
          <span style={{ fontSize: '10px', color: 'var(--amber)', flexShrink: 0 }} title={`repeats ${task.recurring}`}>↻</span>
        )}

        {/* Sub-task toggle */}
        {subTasks.length > 0 && !selected && (
          <button
            onClick={e => { e.stopPropagation(); setSubExpanded(v => !v) }}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '4px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.45)', fontSize: '10px',
              padding: '1px 5px', fontFamily: 'inherit', flexShrink: 0,
            }}
          >
            {subDone}/{subTasks.length} {subExpanded ? '▾' : '▸'}
          </button>
        )}

        {/* Area tag */}
        {task.area && (() => {
          const s = getAreaStyle(task.area)
          return (
            <span style={{
              fontSize: '11px', fontWeight: 500,
              padding: '2px 6px', borderRadius: '4px',
              border: `1px solid ${s.border}`, background: s.bg, color: s.color,
              flexShrink: 0,
            }}>
              #{task.area}
            </span>
          )
        })()}

        {/* Due date */}
        {due && (
          <span style={{ fontSize: '11px', color: due.overdue ? 'var(--red)' : 'rgba(255,255,255,0.45)', flexShrink: 0, fontWeight: 500 }}>
            ~{due.label}
          </span>
        )}

        {/* Action buttons (selected) */}
        {selected && (
          <div style={{ display: 'flex', gap: '3px', flexShrink: 0 }}>
            {[
              {
                label: 'e', title: 'Edit',
                color: 'rgba(255,255,255,0.55)',
                onClick: (e: React.MouseEvent) => { e.stopPropagation(); setEditing(true) },
              },
              ...(onAddSubTask ? [{
                label: '+sub', title: 'Add sub-task',
                color: 'var(--amber)',
                onClick: (e: React.MouseEvent) => { e.stopPropagation(); setShowSubInput(v => !v); setSubExpanded(true) },
              }] : []),
              {
                label: 'mv', title: 'Move section',
                color: 'rgba(255,255,255,0.55)',
                onClick: (e: React.MouseEvent) => { e.stopPropagation(); setShowMove(v => !v) },
              },
              {
                label: 'del', title: 'Delete',
                color: 'var(--red)',
                onClick: (e: React.MouseEvent) => { e.stopPropagation(); onDelete(task.id) },
              },
            ].map(btn => (
              <button
                key={btn.label}
                onClick={btn.onClick}
                title={btn.title}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '4px', cursor: 'pointer',
                  color: btn.color, fontSize: '10px', fontWeight: 600,
                  padding: '2px 6px', fontFamily: 'inherit',
                  letterSpacing: '0.03em',
                  transition: 'all 0.15s',
                }}
              >
                {btn.label}
              </button>
            ))}

            {/* Move dropdown */}
            {showMove && (
              <div style={{
                position: 'absolute', right: '14px', top: '32px',
                background: 'linear-gradient(135deg, rgba(18,18,18,0.98), rgba(10,10,10,0.98))',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px', zIndex: 100, overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(12px)',
              }}>
                {SECTIONS.map(s => (
                  <button
                    key={s}
                    onClick={e => { e.stopPropagation(); onMove(task.id, s); setShowMove(false) }}
                    style={{
                      display: 'block', width: '100%', padding: '8px 16px',
                      background: task.section === s ? 'rgba(125,200,125,0.08)' : 'none',
                      border: 'none',
                      color: task.section === s ? 'var(--green)' : 'rgba(255,255,255,0.72)',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 500,
                      textAlign: 'left', fontFamily: 'inherit',
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => { if (task.section !== s) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                    onMouseLeave={e => { if (task.section !== s) e.currentTarget.style.background = 'none' }}
                  >
                    {s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sub-tasks */}
      {subExpanded && subTasks.map((sub, si) => (
        <div
          key={sub.id}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '5px 14px 5px 48px',
            borderTop: '1px solid rgba(255,255,255,0.03)',
            background: 'rgba(0,0,0,0.1)',
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); onComplete(sub.id) }}
            style={{
              width: '12px', height: '12px', borderRadius: '3px',
              border: `1.5px solid ${sub.completed ? '#7dc87d' : 'rgba(255,255,255,0.1)'}`,
              background: sub.completed ? '#7dc87d' : 'transparent',
              cursor: 'pointer', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '8px', color: '#0d0d0d', transition: 'all 0.2s',
            }}
          >
            {sub.completed && '✓'}
          </button>
          <span style={{
            fontSize: '12px', fontWeight: 400,
            color: sub.completed ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)',
            textDecoration: sub.completed ? 'line-through' : 'none',
            flex: 1,
          }}>
            {sub.title}
          </span>
          <button
            onClick={e => { e.stopPropagation(); onDelete(sub.id) }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.2)', fontSize: '12px', padding: 0,
              fontFamily: 'inherit', flexShrink: 0,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
          >×</button>
        </div>
      ))}

      {/* Sub-task input */}
      {showSubInput && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '6px 14px 6px 48px',
          borderTop: '1px solid rgba(255,255,255,0.04)',
          background: 'rgba(125,200,125,0.03)',
        }}>
          <span style={{ color: 'var(--amber)', fontSize: '12px', userSelect: 'none', flexShrink: 0 }}>›</span>
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
            style={{ flex: 1, fontSize: '12px', fontWeight: 400 }}
          />
        </div>
      )}
    </>
  )
}
