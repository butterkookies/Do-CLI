'use client'

import { useState } from 'react'
import { Task, Section as SectionType } from '@/types'
import { TaskRow } from './TaskRow'

interface Props {
  section: SectionType
  label: string
  tasks: Task[]
  selectedId: string | null
  onSelect: (id: string) => void
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, updates: Partial<Task>) => void
  onMove: (id: string, section: SectionType) => void
  subTaskMap?: Map<string, Task[]>
  onAddSubTask?: (parentId: string, title: string) => void
}

export function SectionBlock({
  section, label, tasks, selectedId,
  onSelect, onComplete, onDelete, onUpdate, onMove,
  subTaskMap, onAddSubTask,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const done = tasks.filter(t => t.completed).length
  const total = tasks.length
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  const allDone = total > 0 && done === total

  return (
    <div className="glass-panel" style={{ marginBottom: '16px' }}>
      <button
        onClick={() => setCollapsed(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: 'none', border: 'none', cursor: 'pointer',
          padding: '12px 14px', width: '100%', textAlign: 'left',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span style={{
          color: 'rgba(255,255,255,0.35)', fontSize: '9px', fontFamily: 'inherit',
          display: 'inline-block', transform: collapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s',
        }}>▼</span>

        <span style={{
          fontSize: '11px', fontWeight: 600, letterSpacing: '0.07em',
          color: 'rgba(255,255,255,0.72)', fontFamily: 'inherit',
          textTransform: 'uppercase', flex: 1,
        }}>
          {label}
        </span>

        <span style={{
          fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '6px',
          ...(allDone
            ? { background: 'rgba(125,200,125,0.12)', color: '#7dc87d', border: '1px solid rgba(125,200,125,0.15)' }
            : { background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.45)', border: '1px solid rgba(255,255,255,0.06)' }),
        }}>
          {allDone ? '✓' : `${done}/${total}`}
        </span>

        {!collapsed && total > 0 && (
          <div style={{ width: '48px', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: 'linear-gradient(90deg, #5a9e5a, #7dc87d)',
              borderRadius: '2px', transition: 'width 0.6s ease',
              boxShadow: '0 0 6px rgba(125,200,125,0.3)',
            }} />
          </div>
        )}
      </button>

      {!collapsed && (
        <div style={{ padding: '4px 0 8px' }}>
          {tasks.length === 0 ? (
            <div style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.25)', fontSize: '12px', fontStyle: 'italic' }}>
              — empty
            </div>
          ) : (
            tasks.map((task, i) => (
              <TaskRow
                key={task.id} task={task} index={i}
                selected={task.id === selectedId}
                onComplete={onComplete} onDelete={onDelete}
                onUpdate={onUpdate} onMove={onMove}
                onClick={() => onSelect(task.id)}
                subTasks={subTaskMap?.get(task.id) ?? []}
                onAddSubTask={onAddSubTask}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}
