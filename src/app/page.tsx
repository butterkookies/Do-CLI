'use client'

import { useState, useRef, useCallback } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useKeyboard } from '@/hooks/useKeyboard'
import { Heatmap } from '@/components/Heatmap'
import { TaskInput } from '@/components/TaskInput'
import { FilterBar } from '@/components/FilterBar'
import { SectionBlock } from '@/components/SectionBlock'
import { Task, Section } from '@/types'

const SECTION_LABELS: Record<Section, string> = {
  today: 'today',
  this_week: 'this week',
  someday: 'someday',
}

export default function Home() {
  const {
    tasks, loading, error,
    filter, setFilter,
    areas,
    addTask, completeTask, deleteTask, updateTask, moveTask, exportJSON,
    heatmapGrid, streak,
    todayCount, todayDone,
  } = useTasks()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const focusInput = useCallback(() => {
    document.querySelector<HTMLInputElement>('input[placeholder*="add task"]')?.focus()
  }, [])

  const focusFilter = useCallback(() => {
    setShowFilter(true)
    setTimeout(() => {
      document.querySelector<HTMLInputElement>('input[placeholder="search tasks..."]')?.focus()
    }, 50)
  }, [])

  useKeyboard({
    tasks,
    selectedId,
    setSelectedId,
    onComplete: completeTask,
    onDelete: deleteTask,
    onNewTask: focusInput,
    onFilter: focusFilter,
    setSection: s => setFilter({ ...filter, section: s }),
    exportJSON,
  })

  // Group tasks by section (for "all" view, show all sections)
  const grouped: { section: Section; label: string; tasks: Task[] }[] = [
    { section: 'today', label: 'today', tasks: [] },
    { section: 'this_week', label: 'this week', tasks: [] },
    { section: 'someday', label: 'someday', tasks: [] },
  ]

  if (filter.section === 'all') {
    for (const t of tasks) {
      const g = grouped.find(g => g.section === t.section)
      if (g) g.tasks.push(t)
    }
  }

  const sectionTasks = filter.section !== 'all'
    ? tasks.filter(t => t.section === filter.section)
    : []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '32px' }}>
          <div>
            <span style={{ fontSize: '20px', fontWeight: 500, color: 'var(--green)', letterSpacing: '-0.02em' }}>
              do.
            </span>
            <span className="cursor" />
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: 'var(--dim)' }}>
            <span>
              <span style={{ color: 'var(--text)' }}>{todayDone}</span>/{todayCount + todayDone} today
            </span>
            <button
              onClick={() => setShowFilter(v => !v)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: showFilter ? 'var(--amber)' : 'var(--dim)',
                fontFamily: 'inherit', fontSize: '11px', padding: 0,
              }}
            >
              [filter]
            </button>
            <button
              onClick={exportJSON}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--dim)', fontFamily: 'inherit', fontSize: '11px', padding: 0,
              }}
            >
              [:export]
            </button>
          </div>
        </div>

        {/* Heatmap */}
        <Heatmap
          cells={heatmapGrid}
          streak={streak}
          todayCount={todayCount}
          todayDone={todayDone}
        />

        {/* Quick Add */}
        <TaskInput
          onAdd={addTask}
          activeSection={filter.section}
        />

        {/* Filter bar (toggle) */}
        {showFilter && (
          <FilterBar filter={filter} setFilter={setFilter} areas={areas} />
        )}

        {/* Error */}
        {error && (
          <div style={{ color: 'var(--red)', fontSize: '12px', marginBottom: '16px' }}>
            error: {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ color: 'var(--dim)', fontSize: '12px' }}>loading...</div>
        )}

        {/* Task list */}
        {!loading && (
          filter.section === 'all' ? (
            grouped.map(g => (
              <SectionBlock
                key={g.section}
                section={g.section}
                label={g.label}
                tasks={g.tasks}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onComplete={completeTask}
                onDelete={deleteTask}
                onUpdate={updateTask}
                onMove={moveTask}
              />
            ))
          ) : (
            <SectionBlock
              section={filter.section as Section}
              label={SECTION_LABELS[filter.section as Section]}
              tasks={sectionTasks}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onComplete={completeTask}
              onDelete={deleteTask}
              onUpdate={updateTask}
              onMove={moveTask}
            />
          )
        )}

        {/* Keyboard help */}
        <div style={{
          marginTop: '40px',
          paddingTop: '16px',
          borderTop: '0.5px solid var(--border)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px 20px',
          fontSize: '11px',
          color: 'var(--muted)',
        }}>
          {[
            ['n', 'new task'],
            ['j/k', 'navigate'],
            ['x', 'complete'],
            ['d', 'delete'],
            ['f', 'filter'],
            ['1/2/3', 'section'],
            ['⌘e', 'export'],
            ['esc', 'deselect'],
          ].map(([k, v]) => (
            <span key={k}>
              <span style={{ color: 'var(--dim)' }}>{k}</span>
              {' '}{v}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
