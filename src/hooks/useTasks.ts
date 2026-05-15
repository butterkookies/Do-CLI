'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Task, NewTask, FilterState, HeatmapDay, Section } from '@/types'
import { parseTaskInput } from '@/lib/parseTask'
import { buildHeatmapGrid, computeStreak } from '@/lib/heatmap'

const DEFAULT_FILTER: FilterState = {
  section: 'all',
  area: null,
  priority: null,
  completed: false,
  search: '',
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER)
  const [heatmapData, setHeatmapData] = useState<HeatmapDay[]>([])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })

    if (error) { setError(error.message); setLoading(false); return }
    setTasks(data as Task[])
    setLoading(false)
  }, [])

  const fetchHeatmap = useCallback(async () => {
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

    const { data } = await supabase
      .from('tasks')
      .select('completed_at')
      .eq('completed', true)
      .gte('completed_at', oneYearAgo.toISOString())

    if (!data) return

    const countMap = new Map<string, number>()
    for (const row of data) {
      if (!row.completed_at) continue
      const date = row.completed_at.split('T')[0]
      countMap.set(date, (countMap.get(date) ?? 0) + 1)
    }

    const result: HeatmapDay[] = Array.from(countMap.entries()).map(([date, count]) => ({ date, count }))
    setHeatmapData(result)
  }, [])

  useEffect(() => {
    fetchTasks()
    fetchHeatmap()
  }, [fetchTasks, fetchHeatmap])

  const addTask = useCallback(async (input: string, sectionOverride?: Section) => {
    const parsed = parseTaskInput(input)
    if (sectionOverride) parsed.section = sectionOverride

    const newTask: Omit<NewTask, 'position'> = {
      title: parsed.title,
      notes: null,
      completed: false,
      completed_at: null,
      section: parsed.section,
      area: parsed.area,
      due_date: parsed.due_date,
      priority: parsed.priority,
      recurring: null,
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select()
      .single()

    if (error) { setError(error.message); return }
    setTasks(prev => [...prev, data as Task])
  }, [])

  const completeTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id)
    if (!task) return

    const completed = !task.completed
    const completed_at = completed ? new Date().toISOString() : null

    const { error } = await supabase
      .from('tasks')
      .update({ completed, completed_at })
      .eq('id', id)

    if (error) { setError(error.message); return }

    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed, completed_at } : t))
    if (completed) {
      const date = new Date().toISOString().split('T')[0]
      setHeatmapData(prev => {
        const existing = prev.find(d => d.date === date)
        if (existing) return prev.map(d => d.date === date ? { ...d, count: d.count + 1 } : d)
        return [...prev, { date, count: 1 }]
      })
    }
  }, [tasks])

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id)
    if (error) { setError(error.message); return }
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const { error } = await supabase.from('tasks').update(updates).eq('id', id)
    if (error) { setError(error.message); return }
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  const moveTask = useCallback(async (id: string, section: Section) => {
    await updateTask(id, { section })
  }, [updateTask])

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `do-export-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [tasks])

  // Derived
  const filteredTasks = tasks.filter(t => {
    if (filter.completed !== null && t.completed !== filter.completed) return false
    if (filter.section !== 'all' && t.section !== filter.section) return false
    if (filter.area && t.area !== filter.area) return false
    if (filter.priority && t.priority !== filter.priority) return false
    if (filter.search && !t.title.toLowerCase().includes(filter.search.toLowerCase())) return false
    return true
  })

  const areas = [...new Set(tasks.map(t => t.area).filter(Boolean))] as string[]

  const todayCount = tasks.filter(t => t.section === 'today' && !t.completed).length
  const todayDone = tasks.filter(t => t.section === 'today' && t.completed).length

  const heatmapGrid = buildHeatmapGrid(heatmapData)
  const streak = computeStreak(heatmapData)

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    loading,
    error,
    filter,
    setFilter,
    areas,
    addTask,
    completeTask,
    deleteTask,
    updateTask,
    moveTask,
    exportJSON,
    heatmapGrid,
    streak,
    todayCount,
    todayDone,
    refetch: fetchTasks,
  }
}
