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

  return (
    <div style={{ marginBottom: '24px' }}>
      <button
        onClick={() => setCollapsed(v => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '0 0 8px 0',
          width: '100%',
          textAlign: 'left',
          borderBottom: '0.5px solid var(--border)',
          marginBottom: '0',
        }}
      >
        <span style={{ color: 'var(--dim)', fontSize: '10px', fontFamily: 'inherit' }}>
          {collapsed ? '▶' : '▼'}
        </span>
        <span style={{
          fontSize: '11px',
          letterSpacing: '0.08em',
          color: 'var(--dim)',
          fontFamily: 'inherit',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <span style={{ color: 'var(--muted)', fontSize: '11px', fontFamily: 'inherit' }}>
          {done}/{total}
        </span>
      </button>

      {!collapsed && (
        <div>
          {tasks.length === 0 ? (
            <div style={{
              padding: '12px 8px',
              color: 'var(--muted)',
              fontSize: '12px',
              fontStyle: 'italic',
            }}>
              — empty
            </div>
          ) : (
            tasks.map((task, i) => (
              <TaskRow
                key={task.id}
                task={task}
                index={i}
                selected={task.id === selectedId}
                onComplete={onComplete}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onMove={onMove}
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
