// Domain types for TaskGrid

export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export type ColumnId = string
export type TaskId = string

export interface ChecklistItem {
  id: string
  text: string
  done: boolean
}

export interface Task {
  id: TaskId
  title: string
  description: string
  priority: Priority
  tags: string[]
  dueDate: string | null // ISO date string
  checklist: ChecklistItem[]
  createdAt: string
  updatedAt: string
}

export interface Column {
  id: ColumnId
  title: string
  taskIds: TaskId[]
  // Optional colour accent per column
  accent?: string
}

export interface Board {
  columns: Column[]
  tasks: Record<TaskId, Task>
}

export type ViewId = 'kanban' | 'list' | 'calendar' | 'timeline'

export type ThemeId = 'light' | 'dark' | 'contrast'

export type ExperienceMode = 'new' | 'power' | 'focus'

export type Density = 'comfortable' | 'cozy' | 'compact'

export interface Preferences {
  theme: ThemeId
  mode: ExperienceMode
  density: Density
  view: ViewId
  animationsEnabled: boolean
  showTooltips: boolean
  showSidebar: boolean
  showInspector: boolean
  // Card field visibility (customizable workspace)
  cardFields: {
    tags: boolean
    dueDate: boolean
    priority: boolean
    checklist: boolean
    description: boolean
  }
  onboardingDone: boolean
}

export interface Filters {
  query: string
  priorities: Priority[]
  tags: string[]
}

export interface AppState {
  board: Board
  prefs: Preferences
  filters: Filters
  selectedTaskId: TaskId | null
}
