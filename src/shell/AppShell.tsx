import { useMemo } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { useDocumentTheme } from '../hooks/useDocumentTheme'
import { useDesktopOpenTask } from '../hooks/useDesktopOpenTask'
import { useHotkeys, type Hotkey } from '../hooks/useHotkeys'
import { useIsTablet } from '../hooks/useMediaQuery'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { SettingsPanel } from './SettingsPanel'
import { Onboarding } from './Onboarding'
import { HelpDialog } from './HelpDialog'
import { CommandPalette } from '../components/palette/CommandPalette'
import { AssistantPanel } from '../components/assistant/AssistantPanel'
import { TaskInspector } from '../components/inspector/TaskInspector'
import { IconClose } from '../components/icons'
import type { ViewId } from '../types'
import './shell.css'

export function AppShell() {
  useDocumentTheme()
  useDesktopOpenTask()
  const { state, dispatch } = useStore()
  const ui = useUi()
  const nav = useNavigate()
  const loc = useLocation()
  const isTablet = useIsTablet()

  const onBoard = loc.pathname.startsWith('/board') || loc.pathname === '/'
  const showSidebar = state.prefs.showSidebar && !isTablet
  const inspectorOpen = onBoard && state.prefs.showInspector && Boolean(state.selectedTaskId)

  const goView = (view: ViewId) => {
    dispatch({ type: 'SET_VIEW', view })
    if (!onBoard) nav('/board')
  }

  const hotkeys = useMemo<Hotkey[]>(
    () => [
      { combo: 'mod+k', handler: (e) => { e.preventDefault(); ui.setPaletteOpen(true) }, allowInInput: true },
      { combo: '/', handler: (e) => { e.preventDefault(); ui.focusSearch() } },
      { combo: 'n', handler: () => {
        const first = state.board.columns[0]
        if (!onBoard) nav('/board')
        if (first) dispatch({ type: 'ADD_TASK', columnId: first.id, title: 'New task' })
      } },
      { combo: '?', handler: () => ui.setHelpOpen(true) },
      { combo: 'shift+?', handler: () => ui.setHelpOpen(true) },
      { combo: 'a', handler: () => ui.setAssistantOpen(true) },
      { combo: 'g b', handler: () => goView('kanban') },
      { combo: 'g l', handler: () => goView('list') },
      { combo: 'g c', handler: () => goView('calendar') },
      { combo: 'g t', handler: () => goView('timeline') },
      {
        combo: 'escape',
        handler: () => {
          if (state.selectedTaskId) dispatch({ type: 'SELECT_TASK', taskId: null })
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ui, state.board.columns, state.selectedTaskId, onBoard],
  )
  useHotkeys(hotkeys)

  return (
    <div
      className={clsx('shell', {
        'shell--no-sidebar': !showSidebar,
        'shell--inspector': inspectorOpen,
      })}
    >
      <a href="#main" className="skip-link">
        Skip to content
      </a>

      {showSidebar && <Sidebar />}
      <Topbar />

      <main id="main" className="shell__main" tabIndex={-1}>
        <Outlet />
      </main>

      {inspectorOpen && <TaskInspector />}

      {/* Mobile navigation drawer */}
      <AnimatePresence>
        {ui.mobileNavOpen && (
          <motion.div
            className="shell__drawer-scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => ui.setMobileNavOpen(false)}
          >
            <motion.div
              className="shell__drawer"
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 360, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="btn btn--icon btn--ghost shell__drawer-close"
                aria-label="Close menu"
                onClick={() => ui.setMobileNavOpen(false)}
              >
                <IconClose size={18} />
              </button>
              <Sidebar mobile />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <CommandPalette />
      <AssistantPanel />
      <SettingsPanel />
      <HelpDialog />
      <Onboarding />
    </div>
  )
}
