import { nanoid } from 'nanoid'
import type { AppState, Task } from '../types'
import type { Action } from './actions'

const touch = (task: Task): Task => ({ ...task, updatedAt: new Date().toISOString() })

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'HYDRATE':
      return action.state

    case 'SYNC_EXTERNAL':
      // Another window changed the shared board. Adopt its data but keep this
      // window's own filters and selection (unless the selected task is gone).
      return {
        ...state,
        board: action.board,
        prefs: action.prefs,
        selectedTaskId:
          state.selectedTaskId && action.board.tasks[state.selectedTaskId] ? state.selectedTaskId : null,
      }

    case 'MOVE_TASK': {
      const { taskId, from, to, toIndex } = action
      const columns = state.board.columns.map((col) => {
        if (col.id === from) {
          return { ...col, taskIds: col.taskIds.filter((id) => id !== taskId) }
        }
        return col
      })
      const target = columns.find((c) => c.id === to)
      if (target) {
        // Guard against duplicates when moving within the same column.
        const cleaned = target.taskIds.filter((id) => id !== taskId)
        const index = Math.max(0, Math.min(toIndex, cleaned.length))
        cleaned.splice(index, 0, taskId)
        target.taskIds = cleaned
      }
      return { ...state, board: { ...state.board, columns } }
    }

    case 'REORDER_COLUMN': {
      const columns = [...state.board.columns]
      const [moved] = columns.splice(action.from, 1)
      columns.splice(action.to, 0, moved)
      return { ...state, board: { ...state.board, columns } }
    }

    case 'ADD_TASK': {
      const id = nanoid(8)
      const now = new Date().toISOString()
      const task: Task = {
        id,
        title: action.title,
        description: '',
        priority: 'medium',
        tags: [],
        dueDate: null,
        checklist: [],
        createdAt: now,
        updatedAt: now,
      }
      const columns = state.board.columns.map((col) =>
        col.id === action.columnId ? { ...col, taskIds: [id, ...col.taskIds] } : col,
      )
      return {
        ...state,
        board: { columns, tasks: { ...state.board.tasks, [id]: task } },
        selectedTaskId: id,
      }
    }

    case 'UPDATE_TASK': {
      const existing = state.board.tasks[action.taskId]
      if (!existing) return state
      const updated = touch({ ...existing, ...action.patch })
      return { ...state, board: { ...state.board, tasks: { ...state.board.tasks, [action.taskId]: updated } } }
    }

    case 'DELETE_TASK': {
      const tasks = { ...state.board.tasks }
      delete tasks[action.taskId]
      const columns = state.board.columns.map((col) => ({
        ...col,
        taskIds: col.taskIds.filter((id) => id !== action.taskId),
      }))
      return {
        ...state,
        board: { columns, tasks },
        selectedTaskId: state.selectedTaskId === action.taskId ? null : state.selectedTaskId,
      }
    }

    case 'ADD_COLUMN': {
      const id = nanoid(6)
      return {
        ...state,
        board: {
          ...state.board,
          columns: [...state.board.columns, { id, title: action.title, taskIds: [], accent: 'var(--primary)' }],
        },
      }
    }

    case 'RENAME_COLUMN': {
      const columns = state.board.columns.map((col) =>
        col.id === action.columnId ? { ...col, title: action.title } : col,
      )
      return { ...state, board: { ...state.board, columns } }
    }

    case 'DELETE_COLUMN': {
      const col = state.board.columns.find((c) => c.id === action.columnId)
      if (!col) return state
      const tasks = { ...state.board.tasks }
      col.taskIds.forEach((id) => delete tasks[id])
      return {
        ...state,
        board: {
          columns: state.board.columns.filter((c) => c.id !== action.columnId),
          tasks,
        },
      }
    }

    case 'TOGGLE_CHECK': {
      const task = state.board.tasks[action.taskId]
      if (!task) return state
      const checklist = task.checklist.map((item) =>
        item.id === action.itemId ? { ...item, done: !item.done } : item,
      )
      return {
        ...state,
        board: { ...state.board, tasks: { ...state.board.tasks, [action.taskId]: touch({ ...task, checklist }) } },
      }
    }

    case 'ADD_CHECK': {
      const task = state.board.tasks[action.taskId]
      if (!task) return state
      const checklist = [...task.checklist, { id: nanoid(6), text: action.text, done: false }]
      return {
        ...state,
        board: { ...state.board, tasks: { ...state.board.tasks, [action.taskId]: touch({ ...task, checklist }) } },
      }
    }

    case 'DELETE_CHECK': {
      const task = state.board.tasks[action.taskId]
      if (!task) return state
      const checklist = task.checklist.filter((item) => item.id !== action.itemId)
      return {
        ...state,
        board: { ...state.board, tasks: { ...state.board.tasks, [action.taskId]: touch({ ...task, checklist }) } },
      }
    }

    case 'SELECT_TASK':
      return { ...state, selectedTaskId: action.taskId }

    case 'SET_THEME':
      return { ...state, prefs: { ...state.prefs, theme: action.theme } }

    case 'SET_MODE': {
      // Switching experience modes nudges sensible defaults for density and panels,
      // but the user can still override afterwards.
      const mode = action.mode
      const presets =
        mode === 'new'
          ? { density: 'comfortable' as const, showTooltips: true, showSidebar: true, showInspector: true }
          : mode === 'power'
            ? { density: 'compact' as const, showTooltips: false, showSidebar: true, showInspector: true }
            : { density: 'cozy' as const, showTooltips: false, showSidebar: false, showInspector: false }
      return { ...state, prefs: { ...state.prefs, mode, ...presets } }
    }

    case 'SET_DENSITY':
      return { ...state, prefs: { ...state.prefs, density: action.density } }

    case 'SET_VIEW':
      return { ...state, prefs: { ...state.prefs, view: action.view } }

    case 'SET_PREF':
      return { ...state, prefs: { ...state.prefs, ...action.patch } }

    case 'SET_CARD_FIELD':
      return {
        ...state,
        prefs: { ...state.prefs, cardFields: { ...state.prefs.cardFields, [action.field]: action.value } },
      }

    case 'SET_FILTER':
      return { ...state, filters: { ...state.filters, ...action.patch } }

    case 'TOGGLE_TAG_FILTER': {
      const tags = state.filters.tags.includes(action.tag)
        ? state.filters.tags.filter((t) => t !== action.tag)
        : [...state.filters.tags, action.tag]
      return { ...state, filters: { ...state.filters, tags } }
    }

    case 'TOGGLE_PRIORITY_FILTER': {
      const priorities = state.filters.priorities.includes(action.priority)
        ? state.filters.priorities.filter((p) => p !== action.priority)
        : [...state.filters.priorities, action.priority]
      return { ...state, filters: { ...state.filters, priorities } }
    }

    case 'CLEAR_FILTERS':
      return { ...state, filters: { query: '', priorities: [], tags: [] } }

    case 'FINISH_ONBOARDING':
      return { ...state, prefs: { ...state.prefs, onboardingDone: true } }

    case 'RESET_ALL':
      return state // handled at provider level (needs fresh seed)

    default:
      return state
  }
}
