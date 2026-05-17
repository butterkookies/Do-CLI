'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { buildHeatmapGrid, computeStreak } from '@/lib/heatmap'
import { Task, HeatmapDay } from '@/types'

interface Stats {
  todayDone: number
  todayTotal: number
  weekDone: number
  weekTotal: number
  streak: { current: number; longest: number }
  totalDone: number
  pendingHigh: number
  heatmapGrid: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[]
  activeTasks: Task[]
  doneTasks: Task[]
  lastUpdated: Date
}

type TaskTab = 'active' | 'done'

const HEAT_COLORS = ['#1e1e1e', '#2d4d2d', '#3d6e3d', '#5a9e5a', '#7dc87d']

const SECTION_LABELS: Record<string, string> = {
  today: 'today',
  this_week: 'week',
  someday: 'someday',
}

function MiniHeatmap({ grid }: { grid: Stats['heatmapGrid'] }) {
  // Show last 12 weeks only
  const weeks: Stats['heatmapGrid'][] = []
  for (let i = 0; i < grid.length; i += 7) weeks.push(grid.slice(i, i + 7))
  const lastWeeks = weeks.slice(-12)

  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {lastWeeks.map((week, wi) => (
        <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {week.map((cell, di) => (
            <div
              key={di}
              title={`${cell.date}: ${cell.count} done`}
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '2px',
                background: HEAT_COLORS[cell.level],
                transition: 'opacity 0.2s',
              }}
            />
          ))}
          {Array.from({ length: 7 - week.length }).map((_, i) => (
            <div key={`pad-${i}`} style={{ width: '10px', height: '10px' }} />
          ))}
        </div>
      ))}
    </div>
  )
}

function Stat({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div style={{
      background: '#161616',
      border: '1px solid #2a2a2a',
      borderRadius: '8px',
      padding: '14px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      flex: 1,
      minWidth: '80px',
    }}>
      <span style={{ fontSize: '10px', color: '#666', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: '26px', fontWeight: 600, color: accent ?? '#e8e8e2', lineHeight: 1 }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: '10px', color: '#555' }}>{sub}</span>
      )}
    </div>
  )
}

function ProgressBar({ done, total, color }: { done: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#666' }}>
        <span>{done}/{total} done</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div style={{ height: '4px', background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: '2px',
          transition: 'width 0.6s ease',
        }} />
      </div>
    </div>
  )
}

function TaskItem({ task, onComplete, isDone }: { task: Task; onComplete: (id: string) => void; isDone: boolean }) {
  const [hovering, setHovering] = useState(false)

  const priColor = task.priority === 'high' ? '#e06c6c' : task.priority === 'low' ? '#444' : 'transparent'
  const sectionLabel = SECTION_LABELS[task.section] ?? task.section

  return (
    <div
      onClick={() => !isDone && onComplete(task.id)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      title={isDone ? `Completed ${task.completed_at ? new Date(task.completed_at).toLocaleDateString() : ''}` : 'Click to complete'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        cursor: isDone ? 'default' : 'pointer',
        padding: '5px 6px',
        borderRadius: '5px',
        background: hovering && !isDone ? 'rgba(125,200,125,0.06)' : 'transparent',
        transition: 'background 0.15s',
      }}
    >
      {/* Checkbox */}
      <span style={{
        width: '14px',
        height: '14px',
        borderRadius: '3px',
        border: `1.5px solid ${isDone ? '#7dc87d' : hovering ? '#7dc87d' : '#333'}`,
        background: isDone ? '#7dc87d' : 'transparent',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '9px',
        color: '#0d0d0d',
        transition: 'all 0.2s',
      }}>
        {isDone && '✓'}
      </span>

      {/* Priority dot */}
      {priColor !== 'transparent' && (
        <span style={{
          width: '4px', height: '4px', borderRadius: '50%',
          background: priColor, flexShrink: 0,
        }} />
      )}

      {/* Title */}
      <span style={{
        fontSize: '11px',
        color: isDone ? '#444' : '#888',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
        textDecoration: isDone ? 'line-through' : 'none',
      }}>
        {task.title}
      </span>

      {/* Area tag */}
      {task.area && (
        <span style={{
          fontSize: '8px',
          color: '#555',
          padding: '1px 4px',
          borderRadius: '3px',
          border: '1px solid #222',
          flexShrink: 0,
        }}>
          #{task.area}
        </span>
      )}

      {/* Section badge */}
      <span style={{
        fontSize: '8px',
        color: '#444',
        flexShrink: 0,
      }}>
        {sectionLabel}
      </span>
    </div>
  )
}

export default function WidgetPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [pulse, setPulse] = useState(false)
  const [tab, setTab] = useState<TaskTab>('active')

  const completeTask = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', id)

    if (!error) {
      setStats(prev => {
        if (!prev) return prev
        const task = prev.activeTasks.find(t => t.id === id)
        if (!task) return prev
        const completedTask = { ...task, completed: true, completed_at: new Date().toISOString() }
        return {
          ...prev,
          activeTasks: prev.activeTasks.filter(t => t.id !== id),
          doneTasks: [completedTask, ...prev.doneTasks],
          todayDone: task.section === 'today' ? prev.todayDone + 1 : prev.todayDone,
          totalDone: prev.totalDone + 1,
          pendingHigh: task.priority === 'high' ? prev.pendingHigh - 1 : prev.pendingHigh,
        }
      })
    }
  }, [])

  const fetchStats = useCallback(async () => {
    setPulse(true)
    setTimeout(() => setPulse(false), 600)

    // Fetch all tasks (same pattern as useTasks.ts — filter parent_id client-side)
    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })

    // Fetch heatmap data
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const { data: heatRaw } = await supabase
      .from('tasks')
      .select('completed_at')
      .eq('completed', true)
      .gte('completed_at', oneYearAgo.toISOString())

    const allTasks: Task[] = ((tasks ?? []) as Task[]).filter(t => !t.parent_id)

    // Today
    const todayTasks = allTasks.filter(t => t.section === 'today')
    const todayDone = todayTasks.filter(t => t.completed).length
    const todayTotal = todayTasks.length

    // This week
    const weekTasks = allTasks.filter(t => t.section === 'this_week' || t.section === 'today')
    const weekDone = weekTasks.filter(t => t.completed).length
    const weekTotal = weekTasks.length

    // Total ever done
    const totalDone = allTasks.filter(t => t.completed).length

    // High priority pending
    const pendingHigh = allTasks.filter(t => !t.completed && t.priority === 'high').length

    // Heatmap
    const countMap = new Map<string, number>()
    for (const row of (heatRaw ?? [])) {
      if (!row.completed_at) continue
      const date = row.completed_at.split('T')[0]
      countMap.set(date, (countMap.get(date) ?? 0) + 1)
    }
    const heatmapData: HeatmapDay[] = Array.from(countMap.entries()).map(([date, count]) => ({ date, count }))
    const heatmapGrid = buildHeatmapGrid(heatmapData)
    const streak = computeStreak(heatmapData)

    // Active tasks — all pending, sorted by section priority (today > this_week > someday)
    const sectionOrder: Record<string, number> = { today: 0, this_week: 1, someday: 2 }
    const activeTasks = allTasks
      .filter(t => !t.completed)
      .sort((a, b) => {
        const sa = sectionOrder[a.section] ?? 3
        const sb = sectionOrder[b.section] ?? 3
        if (sa !== sb) return sa - sb
        // High priority first within section
        const priOrder: Record<string, number> = { high: 0, normal: 1, low: 2 }
        return (priOrder[a.priority] ?? 1) - (priOrder[b.priority] ?? 1)
      })

    // Done tasks — most recently completed first
    const doneTasks = allTasks
      .filter(t => t.completed)
      .sort((a, b) => {
        const aDate = a.completed_at ? new Date(a.completed_at).getTime() : 0
        const bDate = b.completed_at ? new Date(b.completed_at).getTime() : 0
        return bDate - aDate
      })

    setStats({
      todayDone,
      todayTotal,
      weekDone,
      weekTotal,
      streak,
      totalDone,
      pendingHigh,
      heatmapGrid,
      activeTasks,
      doneTasks,
      lastUpdated: new Date(),
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
    // Auto-refresh every 60s
    const interval = setInterval(fetchStats, 60_000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const now = new Date()
  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  const activeCount = stats?.activeTasks.length ?? 0
  const doneCount = stats?.doneTasks.length ?? 0
  const currentTasks = tab === 'active' ? (stats?.activeTasks ?? []) : (stats?.doneTasks ?? [])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d0d0d',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "-apple-system, 'SF Pro Display', 'SF Pro Text', BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      padding: '16px',
    }}>
      {/* Widget card */}
      <div style={{
        width: '380px',
        background: '#111',
        border: '1px solid #2a2a2a',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
      }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: 600, color: '#7dc87d' }}>do.</span>
              <span style={{
                display: 'inline-block', width: '6px', height: '12px',
                background: '#7dc87d',
                animation: 'blink 1.2s step-end infinite',
                verticalAlign: 'middle',
              }} />
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{dateStr}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '28px', fontWeight: 300, color: '#e8e8e2', letterSpacing: '-0.03em', lineHeight: 1 }}>
              {timeStr}
            </div>
            <button
              onClick={fetchStats}
              title="Refresh"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '10px', color: pulse ? '#7dc87d' : '#444',
                fontFamily: 'inherit', padding: 0, marginTop: '4px',
                transition: 'color 0.3s',
              }}
            >
              {pulse ? '↻ syncing...' : `↻ ${stats?.lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) ?? ''}`}
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#444', fontSize: '12px', padding: '20px 0' }}>
            loading stats...
          </div>
        ) : stats ? (
          <>
            {/* Today progress */}
            <div style={{
              background: '#161616',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#666', letterSpacing: '0.08em' }}>TODAY</span>
                <span style={{
                  fontSize: '10px',
                  color: stats.todayDone === stats.todayTotal && stats.todayTotal > 0 ? '#7dc87d' : '#e8b84b',
                  fontWeight: 600,
                }}>
                  {stats.todayDone === stats.todayTotal && stats.todayTotal > 0 ? '✓ all done' : `${stats.todayTotal - stats.todayDone} left`}
                </span>
              </div>
              <ProgressBar done={stats.todayDone} total={stats.todayTotal} color="#7dc87d" />
            </div>

            {/* Task Tabs + List */}
            <div style={{
              background: '#161616',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {/* Tab bar */}
              <div style={{ display: 'flex', gap: '2px', background: '#111', borderRadius: '6px', padding: '2px' }}>
                {(['active', 'done'] as TaskTab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      background: tab === t ? '#222' : 'transparent',
                      color: tab === t
                        ? (t === 'active' ? '#7dc87d' : '#7ab0d4')
                        : '#444',
                      transition: 'all 0.2s',
                    }}
                  >
                    {t === 'active' ? `Active · ${activeCount}` : `Done · ${doneCount}`}
                  </button>
                ))}
              </div>

              {/* Task list */}
              <div style={{
                maxHeight: '220px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1px',
              }}>
                {currentTasks.length === 0 ? (
                  <div style={{ fontSize: '11px', color: '#444', padding: '10px 0', textAlign: 'center' }}>
                    {tab === 'active' ? '🎉 No pending tasks!' : 'No completed tasks yet.'}
                  </div>
                ) : (
                  currentTasks.map(t => (
                    <TaskItem key={t.id} task={t} onComplete={completeTask} isDone={tab === 'done'} />
                  ))
                )}
              </div>
            </div>

            {/* Stat chips */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <Stat
                label="Streak"
                value={stats.streak.current}
                sub={`best ${stats.streak.longest}`}
                accent="#7dc87d"
              />
              <Stat
                label="Week"
                value={`${stats.weekDone}/${stats.weekTotal}`}
                sub="completed"
                accent="#7ab0d4"
              />
              <Stat
                label="Urgent"
                value={stats.pendingHigh}
                sub="high priority"
                accent={stats.pendingHigh > 0 ? '#e06c6c' : '#555'}
              />
            </div>

            {/* Mini heatmap */}
            <div style={{
              background: '#161616',
              border: '1px solid #2a2a2a',
              borderRadius: '8px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '10px', color: '#666', letterSpacing: '0.08em' }}>ACTIVITY · 12 WEEKS</span>
                <span style={{ fontSize: '10px', color: '#555' }}>{stats.totalDone} total done</span>
              </div>
              <MiniHeatmap grid={stats.heatmapGrid} />
            </div>

            {/* Footer link */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <a
                href="/"
                style={{
                  fontSize: '10px', color: '#444',
                  textDecoration: 'none', letterSpacing: '0.06em',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#7dc87d')}
                onMouseLeave={e => (e.currentTarget.style.color = '#444')}
              >
                → open do.
              </a>
            </div>
          </>
        ) : null}
      </div>


    </div>
  )
}
