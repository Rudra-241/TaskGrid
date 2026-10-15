import { useMemo } from 'react'
import type { Filters, Task } from '../types'
import { useStore } from '../store/store'

export function taskMatches(task: Task, filters: Filters): boolean {
  const q = filters.query.trim().toLowerCase()
  if (q) {
    const haystack = [task.title, task.description, ...task.tags].join(' ').toLowerCase()
    if (!haystack.includes(q)) return false
  }
  if (filters.priorities.length && !filters.priorities.includes(task.priority)) return false
  if (filters.tags.length && !filters.tags.some((t) => task.tags.includes(t))) return false
  return true
}

/** All distinct tags across the board, sorted, for the filter UI. */
export function useAllTags(): string[] {
  const { state } = useStore()
  return useMemo(() => {
    const set = new Set<string>()
    Object.values(state.board.tasks).forEach((t) => t.tags.forEach((tag) => set.add(tag)))
    return [...set].sort()
  }, [state.board.tasks])
}

export interface FilteredResult {
  visibleByColumn: Record<string, string[]>
  matchCount: number
  totalCount: number
  filtersActive: boolean
}

export function useFilteredBoard(): FilteredResult {
  const { state } = useStore()
  const { board, filters } = state

  return useMemo(() => {
    const visibleByColumn: Record<string, string[]> = {}
    let matchCount = 0
    board.columns.forEach((col) => {
      const ids = col.taskIds.filter((id) => {
        const task = board.tasks[id]
        return task ? taskMatches(task, filters) : false
      })
      visibleByColumn[col.id] = ids
      matchCount += ids.length
    })
    const filtersActive = Boolean(
      filters.query.trim() || filters.priorities.length || filters.tags.length,
    )
    return {
      visibleByColumn,
      matchCount,
      totalCount: Object.keys(board.tasks).length,
      filtersActive,
    }
  }, [board, filters])
}

/** Flat, filtered task list (for list / calendar / timeline views). */
export function useFilteredTasks(): Task[] {
  const { state } = useStore()
  const { board, filters } = state
  return useMemo(
    () => Object.values(board.tasks).filter((t) => taskMatches(t, filters)),
    [board.tasks, filters],
  )
}
