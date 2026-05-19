'use client'

import { useState, useRef, useCallback } from 'react'
import { useTasks } from '@/hooks/useTasks'
import { useKeyboard } from '@/hooks/useKeyboard'
import { Heatmap } from '@/components/Heatmap'
import { TaskInput } from '@/components/TaskInput'
import { FilterBar } from '@/components/FilterBar'
import { SectionBlock } from '@/components/SectionBlock'
import { KanbanView } from '@/components/KanbanView'
import { TableView } from '@/components/TableView'
import { Task, Section, ViewMode } from '@/types'

const SECTION_LABELS: Record<Section, string> = {
  today: 'today',
  this_week: 'this week',
  someday: 'someday',
}

const VIEW_CYCLE: ViewMode[] = ['list', 'kanban', 'table']

export default function Home() {
  const {
    tasks, allFilteredTasks, subTaskMap,
    loading, error,
    filter, setFilter,
    areas,
    addTask, addSubTask, completeTask, deleteTask, updateTask, moveTask, exportJSON,
    heatmapGrid, streak,
    todayCount, todayDone,
  } = useTasks()

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showFilter, setShowFilter] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
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

  const cycleView = useCallback(() => {
    setViewMode(v => {
      const idx = VIEW_CYCLE.indexOf(v)
      return VIEW_CYCLE[(idx + 1) % VIEW_CYCLE.length]
    })
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
    onCycleView: cycleView,
  })

  // Group tasks by section for list view
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

  const sharedProps = {
    selectedId,
    onSelect: setSelectedId,
    onComplete: completeTask,
    onDelete: deleteTask,
    onMove: moveTask,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div style={{ maxWidth: viewMode === 'kanban' ? '1100px' : '780px', margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '32px',
          paddingBottom: '18px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{
              fontSize: '20px', fontWeight: 600,
              color: 'var(--green)',
              letterSpacing: '-0.02em',
              textShadow: '0 0 14px rgba(125,200,125,0.3)',
            }}>
              do.
            </span>
            <span className="cursor" />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Today progress badge */}
            <span style={{
              fontSize: '11px', fontWeight: 500,
              color: 'rgba(255,255,255,0.55)',
              padding: '3px 10px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>{todayDone}</span>
              <span>/{todayCount + todayDone} today</span>
            </span>

            {/* View switcher */}
            <div style={{
              display: 'flex', gap: '2px',
              background: 'rgba(0,0,0,0.25)',
              borderRadius: '8px', padding: '2px',
              border: '1px solid rgba(255,255,255,0.04)',
            }}>
              {VIEW_CYCLE.map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  style={{
                    padding: '5px 12px',
                    border: 'none', borderRadius: '7px',
                    cursor: 'pointer',
                    fontFamily: 'inherit', fontSize: '11px', fontWeight: 600,
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    background: viewMode === v
                      ? 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))'
                      : 'transparent',
                    color: viewMode === v ? 'var(--green)' : 'rgba(255,255,255,0.45)',
                    boxShadow: viewMode === v
                      ? '0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
                      : 'none',
                    textShadow: viewMode === v ? '0 0 8px rgba(125,200,125,0.2)' : 'none',
                    transition: 'all 0.25s',
                  }}
                  title={`${v} view (v)`}
                >
                  {v[0]}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowFilter(v => !v)}
              style={{
                background: showFilter ? 'rgba(232,184,75,0.08)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${showFilter ? 'rgba(232,184,75,0.2)' : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '7px', cursor: 'pointer',
                color: showFilter ? 'var(--amber)' : 'rgba(255,255,255,0.45)',
                fontFamily: 'inherit', fontSize: '11px', fontWeight: 600,
                letterSpacing: '0.05em',
                padding: '5px 12px',
                transition: 'all 0.2s',
              }}
            >
              FILTER
            </button>
            <button
              onClick={exportJSON}
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '7px', cursor: 'pointer',
                color: 'rgba(255,255,255,0.45)',
                fontFamily: 'inherit', fontSize: '11px', fontWeight: 600,
                letterSpacing: '0.05em',
                padding: '5px 12px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--green)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.45)')}
            >
              EXPORT
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
        <TaskInput onAdd={addTask} activeSection={filter.section} />

        {/* Filter bar */}
        {showFilter && (
          <FilterBar filter={filter} setFilter={setFilter} areas={areas} />
        )}

        {/* Error */}
        {error && (
          <div style={{
            color: 'var(--red)', fontSize: '12px', marginBottom: '16px',
            padding: '8px 12px', borderRadius: '8px',
            background: 'rgba(224,108,108,0.08)',
            border: '1px solid rgba(224,108,108,0.15)',
          }}>
            ✕ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={{ color: 'var(--dim)', fontSize: '12px' }}>loading...</div>
        )}

        {/* Task list — view-dependent */}
        {!loading && viewMode === 'list' && (
          filter.section === 'all' ? (
            grouped.map(g => (
              <SectionBlock
                key={g.section}
                section={g.section}
                label={g.label}
                tasks={g.tasks}
                subTaskMap={subTaskMap}
                onAddSubTask={addSubTask}
                {...sharedProps}
                onUpdate={updateTask}
              />
            ))
          ) : (
            <SectionBlock
              section={filter.section as Section}
              label={SECTION_LABELS[filter.section as Section]}
              tasks={sectionTasks}
              subTaskMap={subTaskMap}
              onAddSubTask={addSubTask}
              {...sharedProps}
              onUpdate={updateTask}
            />
          )
        )}

        {!loading && viewMode === 'kanban' && (
          <KanbanView
            tasks={allFilteredTasks}
            subTaskMap={subTaskMap}
            {...sharedProps}
          />
        )}

        {!loading && viewMode === 'table' && (
          <TableView
            tasks={allFilteredTasks}
            subTaskMap={subTaskMap}
            {...sharedProps}
          />
        )}

        {/* Keyboard help */}
        <div style={{
          marginTop: '40px', paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex', flexWrap: 'wrap', gap: '8px 20px',
          fontSize: '11px',
        }}>
          {[
            ['n', 'new task'],
            ['j/k', 'navigate'],
            ['x', 'complete'],
            ['d', 'delete'],
            ['f', 'filter'],
            ['v', 'view'],
            ['1/2/3', 'section'],
            ['⌘e', 'export'],
            ['esc', 'deselect'],
          ].map(([k, v]) => (
            <span key={k}>
              <span style={{
                color: 'rgba(255,255,255,0.55)',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '4px',
                padding: '0 5px',
                fontFamily: 'monospace',
                fontSize: '10px',
              }}>{k}</span>
              {' '}
              <span style={{ color: 'rgba(255,255,255,0.35)' }}>{v}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
