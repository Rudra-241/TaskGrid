import type { AppState, Board, ColumnId, Density, ExperienceMode, Filters, Preferences, Priority, Task, TaskId, ThemeId, ViewId } from '../types'

export type Action =
  | { type: 'MOVE_TASK'; taskId: TaskId; from: ColumnId; to: ColumnId; toIndex: number }
  | { type: 'REORDER_COLUMN'; from: number; to: number }
  | { type: 'ADD_TASK'; columnId: ColumnId; title: string }
  | { type: 'UPDATE_TASK'; taskId: TaskId; patch: Partial<Task> }
  | { type: 'DELETE_TASK'; taskId: TaskId }
  | { type: 'ADD_COLUMN'; title: string }
  | { type: 'RENAME_COLUMN'; columnId: ColumnId; title: string }
  | { type: 'DELETE_COLUMN'; columnId: ColumnId }
  | { type: 'TOGGLE_CHECK'; taskId: TaskId; itemId: string }
  | { type: 'ADD_CHECK'; taskId: TaskId; text: string }
  | { type: 'DELETE_CHECK'; taskId: TaskId; itemId: string }
  | { type: 'SELECT_TASK'; taskId: TaskId | null }
  | { type: 'SET_THEME'; theme: ThemeId }
  | { type: 'SET_MODE'; mode: ExperienceMode }
  | { type: 'SET_DENSITY'; density: Density }
  | { type: 'SET_VIEW'; view: ViewId }
  | { type: 'SET_PREF'; patch: Partial<Preferences> }
  | { type: 'SET_CARD_FIELD'; field: keyof Preferences['cardFields']; value: boolean }
  | { type: 'SET_FILTER'; patch: Partial<Filters> }
  | { type: 'TOGGLE_TAG_FILTER'; tag: string }
  | { type: 'TOGGLE_PRIORITY_FILTER'; priority: Priority }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'FINISH_ONBOARDING' }
  | { type: 'RESET_ALL' }
  | { type: 'HYDRATE'; state: AppState }
  | { type: 'SYNC_EXTERNAL'; board: Board; prefs: Preferences }
