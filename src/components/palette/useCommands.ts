import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store/store'
import { useUi } from '../../store/ui'
import { useToast } from '../Toaster'
import type { Density, ExperienceMode, ThemeId, ViewId } from '../../types'

export interface Command {
  id: string
  title: string
  hint?: string
  group: 'Views' | 'Create' | 'Appearance' | 'Mode' | 'Panels' | 'Navigate' | 'Tasks' | 'Danger'
  keywords?: string
  shortcut?: string
  run: () => void
}

export function useCommands(closePalette: () => void): Command[] {
  const { state, dispatch, reset } = useStore()
  const ui = useUi()
  const nav = useNavigate()
  const { toast } = useToast()

  return useMemo<Command[]>(() => {
    const setView = (view: ViewId, label: string) => ({
      id: `view-${view}`,
      title: `Go to ${label} view`,
      group: 'Views' as const,
      keywords: `switch ${view} board`,
      run: () => {
        nav('/board')
        dispatch({ type: 'SET_VIEW', view })
        closePalette()
      },
    })

    const setTheme = (theme: ThemeId, label: string) => ({
      id: `theme-${theme}`,
      title: `Theme: ${label}`,
      group: 'Appearance' as const,
      keywords: `dark light contrast colour color`,
      run: () => {
        dispatch({ type: 'SET_THEME', theme })
        toast(`${label} theme`, 'success')
        closePalette()
      },
    })

    const setMode = (mode: ExperienceMode, label: string, hint: string) => ({
      id: `mode-${mode}`,
      title: `Mode: ${label}`,
      hint,
      group: 'Mode' as const,
      keywords: `adaptive experience ${mode}`,
      run: () => {
        dispatch({ type: 'SET_MODE', mode })
        toast(`${label} mode`, 'success')
        closePalette()
      },
    })

    const setDensity = (density: Density, label: string) => ({
      id: `density-${density}`,
      title: `Density: ${label}`,
      group: 'Appearance' as const,
      keywords: `spacing compact comfortable size`,
      run: () => {
        dispatch({ type: 'SET_DENSITY', density })
        closePalette()
      },
    })

    const commands: Command[] = [
      setView('kanban', 'Kanban'),
      setView('list', 'List'),
      setView('calendar', 'Calendar'),
      setView('timeline', 'Timeline'),

      {
        id: 'new-task',
        title: 'Create task',
        group: 'Create',
        shortcut: 'N',
        keywords: 'add new card',
        run: () => {
          nav('/board')
          dispatch({ type: 'SET_VIEW', view: 'kanban' })
          const first = state.board.columns[0]
          if (first) {
            dispatch({ type: 'ADD_TASK', columnId: first.id, title: 'New task' })
            toast('Task created', 'success')
          }
          closePalette()
        },
      },

      setMode('new', 'New user', 'Guided, roomy, tooltips on'),
      setMode('power', 'Power user', 'Compact, shortcuts, dense'),
      setMode('focus', 'Focus', 'Panels hidden, distraction-free'),

      setTheme('light', 'Light'),
      setTheme('dark', 'Dark'),
      setTheme('contrast', 'High contrast'),

      setDensity('comfortable', 'Comfortable'),
      setDensity('cozy', 'Cozy'),
      setDensity('compact', 'Compact'),

      {
        id: 'toggle-sidebar',
        title: state.prefs.showSidebar ? 'Hide sidebar' : 'Show sidebar',
        group: 'Panels',
        keywords: 'panel collapse navigation',
        run: () => {
          dispatch({ type: 'SET_PREF', patch: { showSidebar: !state.prefs.showSidebar } })
          closePalette()
        },
      },
      {
        id: 'toggle-inspector',
        title: state.prefs.showInspector ? 'Disable details panel' : 'Enable details panel',
        group: 'Panels',
        keywords: 'inspector details',
        run: () => {
          dispatch({ type: 'SET_PREF', patch: { showInspector: !state.prefs.showInspector } })
          closePalette()
        },
      },
      {
        id: 'toggle-animations',
        title: state.prefs.animationsEnabled ? 'Turn animations off' : 'Turn animations on',
        group: 'Appearance',
        keywords: 'motion reduce',
        run: () => {
          dispatch({ type: 'SET_PREF', patch: { animationsEnabled: !state.prefs.animationsEnabled } })
          closePalette()
        },
      },
      {
        id: 'open-assistant',
        title: 'Open AI assistant',
        group: 'Navigate',
        shortcut: 'A',
        keywords: 'ai chat assistant bot llm claude help do',
        run: () => {
          ui.setAssistantOpen(true)
          closePalette()
        },
      },
      {
        id: 'open-settings',
        title: 'Open settings',
        group: 'Navigate',
        keywords: 'preferences customise workspace',
        run: () => {
          ui.setSettingsOpen(true)
          closePalette()
        },
      },
      {
        id: 'open-help',
        title: 'Keyboard shortcuts',
        group: 'Navigate',
        shortcut: '?',
        keywords: 'hotkeys help keys',
        run: () => {
          ui.setHelpOpen(true)
          closePalette()
        },
      },
      {
        id: 'open-about',
        title: 'Open HCI notes',
        group: 'Navigate',
        keywords: 'about design personas heuristics accessibility',
        run: () => {
          nav('/about')
          closePalette()
        },
      },
      {
        id: 'clear-filters',
        title: 'Clear all filters',
        group: 'Tasks',
        keywords: 'reset search tags priority',
        run: () => {
          dispatch({ type: 'CLEAR_FILTERS' })
          closePalette()
        },
      },
      {
        id: 'reset-all',
        title: 'Reset workspace to sample data',
        group: 'Danger',
        keywords: 'clear delete restore seed',
        run: () => {
          if (confirm('Reset the whole workspace to the sample board? This clears your tasks.')) {
            reset()
            toast('Workspace reset', 'info')
          }
          closePalette()
        },
      },
    ]

    // Jump-to-task commands, capped so the list stays scannable.
    Object.values(state.board.tasks)
      .slice(0, 40)
      .forEach((task) => {
        commands.push({
          id: `task-${task.id}`,
          title: task.title,
          hint: 'Open task',
          group: 'Tasks',
          keywords: task.tags.join(' '),
          run: () => {
            dispatch({ type: 'SELECT_TASK', taskId: task.id })
            closePalette()
          },
        })
      })

    return commands
  }, [state, dispatch, reset, ui, nav, toast, closePalette])
}
