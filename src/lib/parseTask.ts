import { Priority, Section } from '@/types'

export interface ParsedInput {
  title: string
  area: string | null
  due_date: string | null
  priority: Priority
  section: Section
}

const DAY_MAP: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
}

function resolveDueDate(raw: string): string | null {
  const lower = raw.toLowerCase()

  if (lower === 'today') {
    return new Date().toISOString().split('T')[0]
  }
  if (lower === 'tomorrow' || lower === 'tmr') {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().split('T')[0]
  }

  if (DAY_MAP[lower] !== undefined) {
    const today = new Date()
    const target = DAY_MAP[lower]
    const diff = (target - today.getDay() + 7) % 7 || 7
    const d = new Date()
    d.setDate(today.getDate() + diff)
    return d.toISOString().split('T')[0]
  }

  // ISO date e.g. 2025-06-01
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw

  return null
}

export function parseTaskInput(input: string): ParsedInput {
  let title = input.trim()
  let area: string | null = null
  let due_date: string | null = null
  let priority: Priority = 'normal'
  let section: Section = 'today'

  // Extract #tag
  const tagMatch = title.match(/#(\w+)/)
  if (tagMatch) {
    area = tagMatch[1].toLowerCase()
    title = title.replace(tagMatch[0], '').trim()
  }

  // Extract ~due
  const dueMatch = title.match(/~(\S+)/)
  if (dueMatch) {
    due_date = resolveDueDate(dueMatch[1])
    title = title.replace(dueMatch[0], '').trim()
    // Infer section from due date
    if (due_date) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const due = new Date(due_date)
      const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000)
      if (diff <= 0) section = 'today'
      else if (diff <= 7) section = 'this_week'
      else section = 'someday'
    }
  }

  // Extract !priority
  const priMatch = title.match(/!(high|low|normal)/)
  if (priMatch) {
    priority = priMatch[1] as Priority
    title = title.replace(priMatch[0], '').trim()
  }

  // Collapse multiple spaces
  title = title.replace(/\s+/g, ' ').trim()

  return { title, area, due_date, priority, section }
}

export function formatDueDate(dateStr: string): { label: string; overdue: boolean } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dateStr)
  const diff = Math.ceil((due.getTime() - today.getTime()) / 86400000)

  if (diff < 0) return { label: `${Math.abs(diff)}d overdue`, overdue: true }
  if (diff === 0) return { label: 'today', overdue: false }
  if (diff === 1) return { label: 'tomorrow', overdue: false }
  if (diff <= 6) {
    const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
    return { label: `~${days[due.getDay()]}`, overdue: false }
  }
  return { label: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), overdue: false }
}
