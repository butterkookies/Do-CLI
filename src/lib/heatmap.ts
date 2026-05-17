import { HeatmapDay } from '@/types'

export function buildHeatmapGrid(data: HeatmapDay[]): { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] {
  const map = new Map(data.map(d => [d.date, d.count]))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start from ~52 weeks ago, aligned to Sunday
  const start = new Date(today)
  start.setDate(start.getDate() - 364)
  const dayOfWeek = start.getDay()
  start.setDate(start.getDate() - dayOfWeek)

  const cells: { date: string; count: number; level: 0 | 1 | 2 | 3 | 4 }[] = []

  const cur = new Date(start)
  while (cur <= today) {
    const dateStr = cur.toISOString().split('T')[0]
    const count = map.get(dateStr) ?? 0
    let level: 0 | 1 | 2 | 3 | 4 = 0
    if (count >= 1) level = 1
    if (count >= 3) level = 2
    if (count >= 6) level = 3
    if (count >= 10) level = 4
    cells.push({ date: dateStr, count, level })
    cur.setDate(cur.getDate() + 1)
  }

  return cells
}

export function computeStreak(data: HeatmapDay[]): { current: number; longest: number } {
  const map = new Map(data.map(d => [d.date, d.count]))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let current = 0
  let longest = 0
  let streak = 0

  // Walk backwards for current streak
  const cur = new Date(today)
  while (true) {
    const dateStr = cur.toISOString().split('T')[0]
    const count = map.get(dateStr) ?? 0
    if (count > 0) {
      current++
      cur.setDate(cur.getDate() - 1)
    } else {
      break
    }
  }

  // Walk all for longest
  const sorted = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  let prev: string | null = null
  for (const [date, count] of sorted) {
    if (count === 0) { streak = 0; prev = null; continue }
    if (prev) {
      const d1 = new Date(prev), d2 = new Date(date)
      const diff = (d2.getTime() - d1.getTime()) / 86400000
      if (diff === 1) { streak++; } else { streak = 1 }
    } else {
      streak = 1
    }
    if (streak > longest) longest = streak
    prev = date
  }

  return { current, longest }
}
