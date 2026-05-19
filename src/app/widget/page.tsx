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

const HEAT_COLORS = ['rgba(255,255,255,0.04)', '#2d4d2d', '#3d6e3d', '#5a9e5a', '#7dc87d']

const SECTION_LABELS: Record<string, string> = {
  today: 'today',
  this_week: 'week',
  someday: 'someday',
}

/* ── Mini Heatmap ── */
function MiniHeatmap({ grid }: { grid: Stats['heatmapGrid'] }) {
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
                transition: 'all 0.2s',
                cursor: 'default',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.transform = 'scale(1.4)'
                el.style.opacity = '0.85'
                el.style.zIndex = '10'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement
                el.style.transform = 'scale(1)'
                el.style.opacity = '1'
                el.style.zIndex = '0'
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

/* ── Stat Chip ── */
function StatChip({
  label, value, sub, accent,
}: {
  label: string; value: string | number; sub?: string; accent?: string
}) {
  return (
    <div
      className="glass-chip"
      style={{
        flex: 1,
        padding: '12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <span style={{
        fontSize: '11px', fontWeight: 600,
        color: 'rgba(255,255,255,0.68)',
        letterSpacing: '0.07em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '22px', fontWeight: 600,
        color: accent ?? 'var(--text)', lineHeight: 1,
      }}>
        {value}
      </span>
      {sub && (
        <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.58)' }}>
          {sub}
        </span>
      )}
    </div>
  )
}

/* ── Progress Bar ── */
function ProgressBar({ done, total, color }: { done: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 500, color: 'rgba(255,255,255,0.72)' }}>
        <span>{done}/{total} done</span>
        <span style={{ color }}>{pct}%</span>
      </div>
      <div style={{ height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: `linear-gradient(90deg, #5a9e5a, ${color})`,
          borderRadius: '2px',
          transition: 'width 0.7s ease',
          boxShadow: `0 0 8px ${color}4d`,
        }} />
      </div>
    </div>
  )
}

/* ── Task Item ── */
function TaskItem({
  task, onComplete, isDone,
}: {
  task: Task; onComplete: (id: string) => void; isDone: boolean
}) {
  const [hovering, setHovering] = useState(false)
  const priColor = task.priority === 'high' ? '#e06c6c' : task.priority === 'low' ? 'rgba(255,255,255,0.2)' : 'transparent'
  const sectionLabel = SECTION_LABELS[task.section] ?? task.section

  return (
    <div
      onClick={() => !isDone && onComplete(task.id)}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      title={isDone
        ? `Completed ${task.completed_at ? new Date(task.completed_at).toLocaleDateString() : ''}`
        : 'Click to complete'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '7px',
        cursor: isDone ? 'default' : 'pointer',
        padding: '4px 6px',
        borderRadius: '6px',
        background: hovering && !isDone ? 'rgba(125,200,125,0.06)' : 'transparent',
        boxShadow: hovering && !isDone ? 'inset 0 0 0 1px rgba(125,200,125,0.06)' : 'none',
        transition: 'all 0.2s',
      }}
    >
      {/* Checkbox */}
      <span style={{
        width: '14px', height: '14px',
        borderRadius: '4px',
        border: `1.5px solid ${isDone ? '#7dc87d' : hovering ? 'rgba(125,200,125,0.5)' : 'rgba(255,255,255,0.15)'}`,
        background: isDone ? '#7dc87d' : 'transparent',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '9px',
        color: '#0d0d0d',
        transition: 'all 0.2s',
        boxShadow: isDone ? '0 0 6px rgba(125,200,125,0.3)' : 'none',
      }}>
        {isDone && '✓'}
      </span>

      {/* Priority dot */}
      {priColor !== 'transparent' && (
        <span style={{
          width: '4px', height: '4px',
          borderRadius: '50%',
          background: priColor,
          flexShrink: 0,
        }} />
      )}

      {/* Title */}
      <span style={{
        fontSize: '13px',
        fontWeight: 500,
        color: isDone ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.92)',
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
          fontSize: '11px', fontWeight: 500,
          color: 'rgba(255,255,255,0.65)',
          padding: '2px 6px',
          borderRadius: '4px',
          border: '1px solid rgba(255,255,255,0.15)',
          flexShrink: 0,
        }}>
          #{task.area}
        </span>
      )}

      {/* Section */}
      <span style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', flexShrink: 0 }}>
        {sectionLabel}
      </span>
    </div>
  )
}

/* ── Page ── */
export default function WidgetPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [pulse, setPulse] = useState(false)
  const [tab, setTab] = useState<TaskTab>('active')
  const [clock, setClock] = useState('')
  const [dateStr, setDateStr] = useState('')

  // Live clock
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      setClock(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }))
      setDateStr(now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

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

    const { data: tasks } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })

    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    const { data: heatRaw } = await supabase
      .from('tasks')
      .select('completed_at')
      .eq('completed', true)
      .gte('completed_at', oneYearAgo.toISOString())

    const allTasks: Task[] = ((tasks ?? []) as Task[]).filter(t => !t.parent_id)

    const todayTasks = allTasks.filter(t => t.section === 'today')
    const todayDone = todayTasks.filter(t => t.completed).length
    const todayTotal = todayTasks.length

    const weekTasks = allTasks.filter(t => t.section === 'this_week' || t.section === 'today')
    const weekDone = weekTasks.filter(t => t.completed).length
    const weekTotal = weekTasks.length

    const totalDone = allTasks.filter(t => t.completed).length
    const pendingHigh = allTasks.filter(t => !t.completed && t.priority === 'high').length

    const countMap = new Map<string, number>()
    for (const row of (heatRaw ?? [])) {
      if (!row.completed_at) continue
      const date = row.completed_at.split('T')[0]
      countMap.set(date, (countMap.get(date) ?? 0) + 1)
    }
    const heatmapData: HeatmapDay[] = Array.from(countMap.entries()).map(([date, count]) => ({ date, count }))
    const heatmapGrid = buildHeatmapGrid(heatmapData)
    const streak = computeStreak(heatmapData)

    const sectionOrder: Record<string, number> = { today: 0, this_week: 1, someday: 2 }
    const activeTasks = allTasks
      .filter(t => !t.completed)
      .sort((a, b) => {
        const sa = sectionOrder[a.section] ?? 3
        const sb = sectionOrder[b.section] ?? 3
        if (sa !== sb) return sa - sb
        const priOrder: Record<string, number> = { high: 0, normal: 1, low: 2 }
        return (priOrder[a.priority] ?? 1) - (priOrder[b.priority] ?? 1)
      })

    const doneTasks = allTasks
      .filter(t => t.completed)
      .sort((a, b) => {
        const aDate = a.completed_at ? new Date(a.completed_at).getTime() : 0
        const bDate = b.completed_at ? new Date(b.completed_at).getTime() : 0
        return bDate - aDate
      })

    setStats({
      todayDone, todayTotal,
      weekDone, weekTotal,
      streak, totalDone, pendingHigh,
      heatmapGrid, activeTasks, doneTasks,
      lastUpdated: new Date(),
    })
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60_000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const activeCount = stats?.activeTasks.length ?? 0
  const doneCount = stats?.doneTasks.length ?? 0
  const currentTasks = tab === 'active' ? (stats?.activeTasks ?? []) : (stats?.doneTasks ?? [])
  const todayAllDone = stats && stats.todayTotal > 0 && stats.todayDone === stats.todayTotal

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      animation: 'fadeIn 0.4s ease',
    }}>
      {/* ── Liquid Glass Card ── */}
      <div className="glass-card" style={{ width: '380px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{
                fontSize: '17px', fontWeight: 600,
                color: 'var(--green)',
                textShadow: '0 0 12px rgba(125,200,125,0.3)',
              }}>do.</span>
              <span className="cursor" />
            </div>
            <div style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginTop: '3px' }}>
              {dateStr}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '28px', fontWeight: 300,
              color: 'rgba(255,255,255,0.9)',
              letterSpacing: '-0.03em', lineHeight: 1,
            }}>
              {clock}
            </div>
            <button
              onClick={fetchStats}
              className={pulse ? 'syncing' : ''}
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer',
                fontSize: '11px',
                color: pulse ? 'var(--green)' : 'rgba(255,255,255,0.55)',
                fontFamily: 'inherit',
                padding: 0, marginTop: '3px',
                transition: 'color 0.2s',
              }}
            >
              ↻ {pulse ? 'syncing...' : stats?.lastUpdated.toLocaleTimeString('en-US', {
                hour: '2-digit', minute: '2-digit', hour12: false,
              }) ?? '--:--'}
            </button>
          </div>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{
            textAlign: 'center',
            color: 'rgba(255,255,255,0.65)',
            fontSize: '13px', fontWeight: 500,
            padding: '20px 0',
          }}>
            loading stats...
          </div>
        )}

        {!loading && stats && (
          <>
            {/* ── Today Panel ── */}
            <div className="glass-panel" style={{ padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'rgba(255,255,255,0.72)',
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                }}>
                  Today
                </span>
                <span className={todayAllDone ? 'badge-done' : 'badge-warn'}>
                  {todayAllDone ? '✓ all done' : `${stats.todayTotal - stats.todayDone} left`}
                </span>
              </div>
              <ProgressBar done={stats.todayDone} total={stats.todayTotal} color="#7dc87d" />
            </div>

            {/* ── Task Tabs + List ── */}
            <div className="glass-panel" style={{ padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {/* Tab bar */}
              <div style={{
                display: 'flex', gap: '2px',
                background: 'rgba(0,0,0,0.25)',
                borderRadius: '8px', padding: '2px',
                border: '1px solid rgba(255,255,255,0.03)',
              }}>
                {(['active', 'done'] as TaskTab[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    style={{
                      flex: 1,
                      padding: '6px 0',
                      border: 'none',
                      borderRadius: '7px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '11px', fontWeight: 600,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      background: tab === t
                        ? 'linear-gradient(135deg, rgba(255,255,255,0.07), rgba(255,255,255,0.03))'
                        : 'transparent',
                      color: tab === t
                        ? (t === 'active' ? '#7dc87d' : '#7ab0d4')
                        : 'rgba(255,255,255,0.55)',
                      boxShadow: tab === t
                        ? '0 1px 4px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)'
                        : 'none',
                      textShadow: tab === t
                        ? (t === 'active' ? '0 0 8px rgba(125,200,125,0.2)' : '0 0 8px rgba(122,176,212,0.2)')
                        : 'none',
                      transition: 'all 0.25s',
                    }}
                  >
                    {t === 'active' ? `Active · ${activeCount}` : `Done · ${doneCount}`}
                  </button>
                ))}
              </div>

              {/* Task list */}
              <div style={{
                maxHeight: '200px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '1px',
              }}>
                {currentTasks.length === 0 ? (
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.4)',
                    padding: '12px 0',
                    textAlign: 'center',
                  }}>
                    {tab === 'active' ? '🎉 No pending tasks!' : 'No completed tasks yet.'}
                  </div>
                ) : (
                  currentTasks.map(t => (
                    <TaskItem key={t.id} task={t} onComplete={completeTask} isDone={tab === 'done'} />
                  ))
                )}
              </div>
            </div>

            {/* ── Stat Chips ── */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <StatChip label="Streak" value={stats.streak.current} sub={`best ${stats.streak.longest}`} accent="#7dc87d" />
              <StatChip label="Week" value={`${stats.weekDone}/${stats.weekTotal}`} sub="completed" accent="#7ab0d4" />
              <StatChip
                label="Urgent"
                value={stats.pendingHigh}
                sub="high pri"
                accent={stats.pendingHigh > 0 ? '#e06c6c' : 'rgba(255,255,255,0.3)'}
              />
            </div>

            {/* ── Heatmap Panel ── */}
            <div className="glass-panel" style={{ padding: '13px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 600,
                  color: 'rgba(255,255,255,0.72)',
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                }}>
                  Activity · 12 weeks
                </span>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>
                  {stats.totalDone} total
                </span>
              </div>
              <MiniHeatmap grid={stats.heatmapGrid} />
            </div>

            {/* ── Footer ── */}
            <div style={{ textAlign: 'center' }}>
              <a
                href="/"
                style={{
                  fontSize: '11px', fontWeight: 500,
                  color: 'rgba(255,255,255,0.45)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget
                  el.style.color = '#7dc87d'
                  el.style.textShadow = '0 0 8px rgba(125,200,125,0.3)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget
                  el.style.color = 'rgba(255,255,255,0.45)'
                  el.style.textShadow = 'none'
                }}
              >
                → open do.
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
