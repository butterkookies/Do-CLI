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

const COLUMNS: { section: Section; label: string; accent: string }[] = [
  { section: 'today',     label: 'today',     accent: '#7dc87d' },
  { section: 'this_week', label: 'this week', accent: '#7ab0d4' },
  { section: 'someday',   label: 'someday',   accent: '#b39ddb' },
]

const OTHER_SECTIONS = (current: Section): Section[] =>
  COLUMNS.map(c => c.section).filter(s => s !== current)

export function KanbanView({ tasks, subTaskMap, selectedId, onSelect, onComplete, onDelete, onMove }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', alignItems: 'start' }}>
      {COLUMNS.map(col => {
        const colTasks = tasks.filter(t => t.section === col.section)
        const done = colTasks.filter(t => t.completed).length
        const total = colTasks.length
        const pct = total === 0 ? 0 : Math.round((done / total) * 100)

        return (
          <div key={col.section} className="glass-panel">
            {/* Column header */}
            <div style={{
              padding: '12px 14px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', gap: '8px',
            }}>
              <span style={{
                fontSize: '11px', fontWeight: 600,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                color: col.accent,
                textShadow: `0 0 8px ${col.accent}4d`,
                flex: 1,
              }}>
                {col.label}
              </span>
              <span style={{
                fontSize: '11px', fontWeight: 600,
                padding: '2px 7px', borderRadius: '5px',
                background: done === total && total > 0 ? 'rgba(125,200,125,0.1)' : 'rgba(255,255,255,0.04)',
                color: done === total && total > 0 ? '#7dc87d' : 'rgba(255,255,255,0.4)',
                border: `1px solid ${done === total && total > 0 ? 'rgba(125,200,125,0.15)' : 'rgba(255,255,255,0.06)'}`,
              }}>
                {done}/{total}
              </span>
            </div>

            {/* Mini progress bar */}
            {total > 0 && (
              <div style={{ height: '2px', background: 'rgba(255,255,255,0.04)' }}>
                <div style={{
                  height: '100%', width: `${pct}%`,
                  background: `linear-gradient(90deg, ${col.accent}88, ${col.accent})`,
                  transition: 'width 0.6s ease',
                }} />
              </div>
            )}

            {/* Cards */}
            <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {colTasks.length === 0 ? (
                <div style={{
                  color: 'rgba(255,255,255,0.2)', fontSize: '12px',
                  fontStyle: 'italic', padding: '8px 6px',
                }}>— empty</div>
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
  const [hovering, setHovering] = useState(false)
  const due = task.due_date ? formatDueDate(task.due_date) : null
  const subDone = subTasks.filter(t => t.completed).length

  const priColor = task.priority === 'high' ? '#e06c6c'
    : task.priority === 'low' ? 'rgba(255,255,255,0.15)'
    : 'transparent'

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      style={{
        background: selected
          ? 'rgba(125,200,125,0.06)'
          : hovering ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${selected ? 'rgba(125,200,125,0.2)' : 'rgba(255,255,255,0.06)'}`,
        borderLeft: `2px solid ${priColor !== 'transparent' ? priColor : (selected ? 'rgba(125,200,125,0.4)' : 'rgba(255,255,255,0.06)')}`,
        borderRadius: '8px',
        padding: '10px 12px',
        cursor: 'default',
        transition: 'all 0.15s',
        boxShadow: selected ? '0 0 12px rgba(125,200,125,0.08)' : 'none',
      }}
    >
      {/* Title row */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        <button
          onClick={e => { e.stopPropagation(); onComplete(task.id) }}
          style={{
            width: '13px', height: '13px', borderRadius: '3px',
            border: `1.5px solid ${task.completed ? '#7dc87d' : 'rgba(255,255,255,0.2)'}`,
            background: task.completed ? '#7dc87d' : 'transparent',
            cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '8px', color: '#0d0d0d',
            boxShadow: task.completed ? '0 0 5px rgba(125,200,125,0.3)' : 'none',
            transition: 'all 0.2s', marginTop: '2px',
          }}
        >
          {task.completed && '✓'}
        </button>
        <span style={{
          fontSize: '12px', fontWeight: 500,
          color: task.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.88)',
          textDecoration: task.completed ? 'line-through' : 'none',
          flex: 1, wordBreak: 'break-word', lineHeight: 1.5,
        }}>
          {task.title}
        </span>
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', gap: '6px', marginTop: '7px', flexWrap: 'wrap', alignItems: 'center' }}>
        {task.area && (
          <span style={{
            fontSize: '10px', fontWeight: 500,
            color: 'var(--blue)',
            padding: '1px 5px', borderRadius: '3px',
            border: '1px solid rgba(122,176,212,0.15)',
            background: 'rgba(122,176,212,0.06)',
          }}>#{task.area}</span>
        )}
        {due && (
          <span style={{ fontSize: '10px', fontWeight: 500, color: due.overdue ? 'var(--red)' : 'rgba(255,255,255,0.4)' }}>
            ~{due.label}
          </span>
        )}
        {task.recurring && (
          <span style={{ fontSize: '10px', color: 'var(--amber)' }}>↻</span>
        )}
        {subTasks.length > 0 && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(v => !v) }}
            style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '3px', cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)', fontSize: '10px',
              padding: '1px 5px', fontFamily: 'inherit',
            }}
          >
            {subDone}/{subTasks.length} {expanded ? '▾' : '▸'}
          </button>
        )}
      </div>

      {/* Sub-tasks */}
      {expanded && subTasks.length > 0 && (
        <div style={{
          marginTop: '7px', paddingLeft: '20px',
          display: 'flex', flexDirection: 'column', gap: '3px',
          borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '6px',
        }}>
          {subTasks.map(sub => (
            <div key={sub.id} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button
                onClick={e => { e.stopPropagation(); onComplete(sub.id) }}
                style={{
                  width: '10px', height: '10px', borderRadius: '2px',
                  border: `1px solid ${sub.completed ? '#7dc87d' : 'rgba(255,255,255,0.15)'}`,
                  background: sub.completed ? '#7dc87d' : 'transparent',
                  cursor: 'pointer', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '7px', color: '#0d0d0d', transition: 'all 0.15s',
                }}
              >
                {sub.completed && '✓'}
              </button>
              <span style={{
                fontSize: '11px', fontWeight: 400,
                color: sub.completed ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)',
                textDecoration: sub.completed ? 'line-through' : 'none',
              }}>
                {sub.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Selected actions */}
      {selected && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap' }}>
          {otherSections.map(s => (
            <button
              key={s}
              onClick={e => { e.stopPropagation(); onMove(task.id, s) }}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '5px', cursor: 'pointer',
                color: 'rgba(255,255,255,0.55)', fontSize: '10px', fontWeight: 500,
                padding: '2px 7px', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--green)'; e.currentTarget.style.borderColor = 'rgba(125,200,125,0.2)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            >
              → {s.replace('_', ' ')}
            </button>
          ))}
          <button
            onClick={e => { e.stopPropagation(); onDelete(task.id) }}
            style={{
              background: 'rgba(224,108,108,0.08)',
              border: '1px solid rgba(224,108,108,0.15)',
              borderRadius: '5px', cursor: 'pointer',
              color: 'var(--red)', fontSize: '10px', fontWeight: 600,
              padding: '2px 7px', fontFamily: 'inherit',
            }}
          >
            del
          </button>
        </div>
      )}
    </div>
  )
}
