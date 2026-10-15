import type { Board, Column, Task } from '../types'
import { formatDue, priorityMeta, type DueMeta } from '../lib/format'

// Columns are user-editable, so widgets find their roles by id first (the seed
// board), then by title, then by position.

export function findDoneColumn(columns: Column[]): Column | undefined {
  return (
    columns.find((c) => c.id === 'done') ??
    columns.find((c) => /^(done|complete[d]?|finished)$/i.test(c.title.trim())) ??
    columns[columns.length - 1]
  )
}

export function findActiveColumn(columns: Column[]): Column | undefined {
  return columns.find((c) => c.id === 'doing') ?? columns.find((c) => /progress|doing|active/i.test(c.title))
}

/** Where quick-added tasks land. */
export function findInboxColumn(columns: Column[]): Column | undefined {
  const done = findDoneColumn(columns)
  return (
    columns.find((c) => c.id === 'todo') ??
    columns.find((c) => /^to ?-?do$/i.test(c.title.trim())) ??
    columns.find((c) => c !== done)
  )
}

export interface OpenTask {
  task: Task
  columnId: string
  due: DueMeta | null
}

/** Every task that is not in the done column, in board order. */
export function openTasks(board: Board): OpenTask[] {
  const done = findDoneColumn(board.columns)
  const out: OpenTask[] = []
  for (const col of board.columns) {
    if (col === done) continue
    for (const id of col.taskIds) {
      const task = board.tasks[id]
      if (task) out.push({ task, columnId: col.id, due: formatDue(task.dueDate) })
    }
  }
  return out
}

export type AgendaGroup = 'overdue' | 'today' | 'soon' | 'later' | 'none'

export const agendaGroupLabel: Record<AgendaGroup, string> = {
  overdue: 'Overdue',
  today: 'Today',
  soon: 'This week',
  later: 'Later',
  none: 'No date',
}

const groupOrder: AgendaGroup[] = ['overdue', 'today', 'soon', 'later', 'none']

/** Open tasks grouped by urgency: dated tasks by date, undated by priority. */
export function agenda(board: Board): { group: AgendaGroup; items: OpenTask[] }[] {
  const byTime = (a: OpenTask, b: OpenTask) => {
    if (a.task.dueDate && b.task.dueDate) {
      const d = new Date(a.task.dueDate).getTime() - new Date(b.task.dueDate).getTime()
      if (d !== 0) return d
    }
    return priorityMeta[a.task.priority].order - priorityMeta[b.task.priority].order
  }
  const groups = new Map<AgendaGroup, OpenTask[]>()
  for (const item of openTasks(board)) {
    const g: AgendaGroup = item.due ? item.due.tone : 'none'
    const list = groups.get(g) ?? []
    list.push(item)
    groups.set(g, list)
  }
  return groupOrder
    .filter((g) => groups.has(g))
    .map((g) => ({ group: g, items: groups.get(g)!.sort(byTime) }))
}

export interface BoardStats {
  total: number
  done: number
  pct: number
  overdue: number
  today: number
  week: number
  columns: { id: string; title: string; accent?: string; count: number }[]
}

export function boardStats(board: Board): BoardStats {
  const done = findDoneColumn(board.columns)
  const open = openTasks(board)
  const total = Object.keys(board.tasks).length
  const doneCount = done ? done.taskIds.filter((id) => board.tasks[id]).length : 0
  return {
    total,
    done: doneCount,
    pct: total ? Math.round((doneCount / total) * 100) : 0,
    overdue: open.filter((o) => o.due?.tone === 'overdue').length,
    today: open.filter((o) => o.due?.tone === 'today').length,
    week: open.filter((o) => o.due?.tone === 'today' || o.due?.tone === 'soon').length,
    columns: board.columns.map((c) => ({
      id: c.id,
      title: c.title,
      accent: c.accent,
      count: c.taskIds.filter((id) => board.tasks[id]).length,
    })),
  }
}
