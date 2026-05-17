'use client'

import { useEffect, useCallback } from 'react'
import { Task, Section } from '@/types'

interface Options {
  tasks: Task[]
  selectedId: string | null
  setSelectedId: (id: string | null) => void
  onComplete: (id: string) => void
  onDelete: (id: string) => void
  onNewTask: () => void
  onFilter: () => void
  setSection: (s: Section | 'all') => void
  exportJSON: () => void
  onCycleView?: () => void
}

export function useKeyboard({
  tasks, selectedId, setSelectedId,
  onComplete, onDelete, onNewTask, onFilter, setSection, exportJSON, onCycleView,
}: Options) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return

    switch (e.key) {
      case 'j':
      case 'ArrowDown': {
        e.preventDefault()
        if (!selectedId) {
          if (tasks.length) setSelectedId(tasks[0].id)
        } else {
          const idx = tasks.findIndex(t => t.id === selectedId)
          if (idx < tasks.length - 1) setSelectedId(tasks[idx + 1].id)
        }
        break
      }
      case 'k':
      case 'ArrowUp': {
        e.preventDefault()
        if (!selectedId) {
          if (tasks.length) setSelectedId(tasks[tasks.length - 1].id)
        } else {
          const idx = tasks.findIndex(t => t.id === selectedId)
          if (idx > 0) setSelectedId(tasks[idx - 1].id)
        }
        break
      }
      case 'x': {
        if (selectedId) onComplete(selectedId)
        break
      }
      case 'd': {
        if (selectedId) {
          onDelete(selectedId)
          setSelectedId(null)
        }
        break
      }
      case 'n': {
        e.preventDefault()
        onNewTask()
        break
      }
      case 'f': {
        e.preventDefault()
        onFilter()
        break
      }
      case '1': setSection('today'); break
      case '2': setSection('this_week'); break
      case '3': setSection('someday'); break
      case '0': setSection('all'); break
      case 'Escape': {
        setSelectedId(null)
        break
      }
      case 'e': {
        if (e.ctrlKey || e.metaKey) { e.preventDefault(); exportJSON() }
        break
      }
      case 'v': {
        e.preventDefault()
        onCycleView?.()
        break
      }
    }
  }, [tasks, selectedId, setSelectedId, onComplete, onDelete, onNewTask, onFilter, setSection, exportJSON, onCycleView])

  useEffect(() => {
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleKey])
}
