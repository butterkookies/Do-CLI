export type Section = 'today' | 'this_week' | 'someday'
export type Priority = 'high' | 'normal' | 'low'

export interface Task {
  id: string
  created_at: string
  updated_at: string
  title: string
  notes: string | null
  completed: boolean
  completed_at: string | null
  section: Section
  area: string | null
  due_date: string | null
  priority: Priority
  recurring: string | null
  position: number
}

export type NewTask = Omit<Task, 'id' | 'created_at' | 'updated_at'>

export interface FilterState {
  section: Section | 'all'
  area: string | null
  priority: Priority | null
  completed: boolean | null
  search: string
}

export interface HeatmapDay {
  date: string
  count: number
}
