import type { AppState, Priority, ThemeId, ViewId } from '../../types'
import type { Action } from '../../store/actions'

// A minimal handle onto the store: read the latest state, dispatch actions.
export interface ToolContext {
  getState: () => AppState
  dispatch: (action: Action) => void
}

type ToolInput = Record<string, unknown>

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v.trim() : undefined)
const num = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const strArray = (v: unknown): string[] | undefined =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : undefined

function isoFromDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(12, 0, 0, 0)
  return d.toISOString()
}

// Resolve a task by explicit id first, then by a case-insensitive title substring.
function findTaskId(state: AppState, input: ToolInput): string | undefined {
  const byId = str(input.taskId)
  if (byId && state.board.tasks[byId]) return byId
  const match = str(input.titleMatch)?.toLowerCase()
  if (!match) return undefined
  const hit = Object.values(state.board.tasks).find((t) => t.title.toLowerCase().includes(match))
  return hit?.id
}

function findColumnId(state: AppState, match: string | undefined): string | undefined {
  if (!match) return undefined
  const m = match.toLowerCase()
  const col =
    state.board.columns.find((c) => c.id.toLowerCase() === m) ??
    state.board.columns.find((c) => c.title.toLowerCase().includes(m))
  return col?.id
}

/**
 * Apply one tool call to the store. Returns a short human-readable result that
 * is sent back to the model as the tool_result, so it can chain further calls
 * (e.g. add a task, then set its due date) and summarise what it did.
 */
export function executeTool(name: string, rawInput: unknown, ctx: ToolContext): string {
  const input = (rawInput ?? {}) as ToolInput
  const { getState, dispatch } = ctx

  switch (name) {
    case 'add_task': {
      const title = str(input.title)
      if (!title) return 'Error: a task title is required.'
      const state = getState()
      const columnId = findColumnId(state, str(input.column)) ?? state.board.columns[0]?.id
      if (!columnId) return 'Error: there are no columns to add a task to.'

      dispatch({ type: 'ADD_TASK', columnId, title })
      // ADD_TASK selects the new task; read its id back from fresh state.
      const id = getState().selectedTaskId
      if (!id) return `Added "${title}".`

      const patch: Record<string, unknown> = {}
      const priority = str(input.priority)
      if (priority) patch.priority = priority as Priority
      const description = str(input.description)
      if (description) patch.description = description
      const tags = strArray(input.tags)
      if (tags && tags.length) patch.tags = tags
      const dueInDays = num(input.dueInDays)
      if (dueInDays !== undefined) patch.dueDate = isoFromDays(dueInDays)
      if (Object.keys(patch).length) dispatch({ type: 'UPDATE_TASK', taskId: id, patch })

      for (const text of strArray(input.checklist) ?? []) {
        dispatch({ type: 'ADD_CHECK', taskId: id, text })
      }

      const col = getState().board.columns.find((c) => c.id === columnId)
      return `Added "${title}" (id ${id}) to "${col?.title ?? columnId}".`
    }

    case 'update_task': {
      const state = getState()
      const id = findTaskId(state, input)
      if (!id) return 'Error: could not find that task.'
      const patch: Record<string, unknown> = {}
      const title = str(input.title)
      if (title) patch.title = title
      const priority = str(input.priority)
      if (priority) patch.priority = priority as Priority
      if (typeof input.description === 'string') patch.description = input.description
      const tags = strArray(input.tags)
      if (tags) patch.tags = tags
      if ('dueInDays' in input) {
        const d = num(input.dueInDays)
        patch.dueDate = d === undefined ? null : isoFromDays(d)
      }
      if (!Object.keys(patch).length) return 'Nothing to update — no fields were provided.'
      dispatch({ type: 'UPDATE_TASK', taskId: id, patch })
      return `Updated "${state.board.tasks[id].title}".`
    }

    case 'move_task': {
      const state = getState()
      const id = findTaskId(state, input)
      if (!id) return 'Error: could not find that task.'
      const toId = findColumnId(state, str(input.toColumn))
      if (!toId) return `Error: could not find a column matching "${str(input.toColumn) ?? ''}".`
      const from = state.board.columns.find((c) => c.taskIds.includes(id))
      if (!from) return 'Error: could not locate the task in a column.'
      dispatch({ type: 'MOVE_TASK', taskId: id, from: from.id, to: toId, toIndex: 0 })
      const col = state.board.columns.find((c) => c.id === toId)
      return `Moved "${state.board.tasks[id].title}" to "${col?.title ?? toId}".`
    }

    case 'delete_task': {
      const state = getState()
      const id = findTaskId(state, input)
      if (!id) return 'Error: could not find that task.'
      const title = state.board.tasks[id].title
      dispatch({ type: 'DELETE_TASK', taskId: id })
      return `Deleted "${title}".`
    }

    case 'add_checklist_item': {
      const state = getState()
      const id = findTaskId(state, input)
      if (!id) return 'Error: could not find that task.'
      const text = str(input.text)
      if (!text) return 'Error: checklist item text is required.'
      dispatch({ type: 'ADD_CHECK', taskId: id, text })
      return `Added checklist item "${text}" to "${state.board.tasks[id].title}".`
    }

    case 'add_column': {
      const title = str(input.title)
      if (!title) return 'Error: a column title is required.'
      dispatch({ type: 'ADD_COLUMN', title })
      return `Added column "${title}".`
    }

    case 'rename_column': {
      const state = getState()
      const columnId = findColumnId(state, str(input.columnMatch))
      const title = str(input.title)
      if (!columnId) return 'Error: could not find that column.'
      if (!title) return 'Error: a new title is required.'
      const old = state.board.columns.find((c) => c.id === columnId)?.title
      dispatch({ type: 'RENAME_COLUMN', columnId, title })
      return `Renamed "${old ?? columnId}" to "${title}".`
    }

    case 'set_view': {
      const view = str(input.view) as ViewId | undefined
      if (!view) return 'Error: a view is required.'
      dispatch({ type: 'SET_VIEW', view })
      return `Switched to the ${view} view.`
    }

    case 'set_theme': {
      const theme = str(input.theme) as ThemeId | undefined
      if (!theme) return 'Error: a theme is required.'
      dispatch({ type: 'SET_THEME', theme })
      return `Switched to the ${theme} theme.`
    }

    case 'set_filter': {
      const query = typeof input.query === 'string' ? input.query : ''
      const priorities = (strArray(input.priorities) ?? []) as Priority[]
      dispatch({ type: 'SET_FILTER', patch: { query, priorities } })
      const bits = [query && `query "${query}"`, priorities.length && `priorities ${priorities.join(', ')}`].filter(
        Boolean,
      )
      return bits.length ? `Filtered by ${bits.join(' and ')}.` : 'Cleared all filters.'
    }

    default:
      return `Error: unknown tool "${name}".`
  }
}
