import type { Priority } from '../types'

export const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'urgent']

export const priorityMeta: Record<Priority, { label: string; color: string; soft: string; order: number }> = {
  urgent: { label: 'Urgent', color: 'var(--p-urgent)', soft: 'var(--accent-soft)', order: 0 },
  high: { label: 'High', color: 'var(--p-high)', soft: 'rgba(224,169,75,0.16)', order: 1 },
  medium: { label: 'Medium', color: 'var(--p-medium)', soft: 'var(--primary-soft)', order: 2 },
  low: { label: 'Low', color: 'var(--p-low)', soft: 'var(--surface-2)', order: 3 },
}

const dayMs = 24 * 60 * 60 * 1000

function startOfDay(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export interface DueMeta {
  label: string
  tone: 'overdue' | 'today' | 'soon' | 'later'
}

/** Human, relative due-date label with a tone for colouring. */
export function formatDue(iso: string | null): DueMeta | null {
  if (!iso) return null
  const due = startOfDay(new Date(iso))
  const today = startOfDay(new Date())
  const diffDays = Math.round((due.getTime() - today.getTime()) / dayMs)

  if (diffDays < 0) {
    const n = Math.abs(diffDays)
    return { label: n === 1 ? 'Yesterday' : `${n}d overdue`, tone: 'overdue' }
  }
  if (diffDays === 0) return { label: 'Today', tone: 'today' }
  if (diffDays === 1) return { label: 'Tomorrow', tone: 'soon' }
  if (diffDays <= 6) return { label: `${diffDays}d`, tone: 'soon' }

  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return { label: due.toLocaleDateString(undefined, opts), tone: 'later' }
}

export function checklistProgress(items: { done: boolean }[]): { done: number; total: number; pct: number } {
  const total = items.length
  const done = items.filter((i) => i.done).length
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 }
}

export function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

export function fromDateInputValue(value: string): string | null {
  if (!value) return null
  const d = new Date(`${value}T12:00:00`)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}
