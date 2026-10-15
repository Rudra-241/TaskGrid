import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { useToast } from '../components/Toaster'
import { FilterBar } from '../components/filters/FilterBar'
import { useIsMobile } from '../hooks/useMediaQuery'
import type { ThemeId, ViewId } from '../types'
import {
  IconKanban,
  IconList,
  IconCalendar,
  IconTimeline,
  IconSun,
  IconMoon,
  IconContrast,
  IconMenu,
  IconCommand,
} from '../components/icons'
import './topbar.css'

const VIEWS: { id: ViewId; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'kanban', label: 'Board', icon: IconKanban },
  { id: 'list', label: 'List', icon: IconList },
  { id: 'calendar', label: 'Calendar', icon: IconCalendar },
  { id: 'timeline', label: 'Timeline', icon: IconTimeline },
]

const THEME_ORDER: ThemeId[] = ['light', 'dark', 'contrast']
const THEME_LABEL: Record<ThemeId, string> = { light: 'Light', dark: 'Dark', contrast: 'High contrast' }

export function Topbar() {
  const { state, dispatch } = useStore()
  const ui = useUi()
  const nav = useNavigate()
  const loc = useLocation()
  const { toast } = useToast()
  const isMobile = useIsMobile()
  const onBoard = loc.pathname.startsWith('/board') || loc.pathname === '/'
  const theme = state.prefs.theme

  const cycleTheme = () => {
    const next = THEME_ORDER[(THEME_ORDER.indexOf(theme) + 1) % THEME_ORDER.length]
    dispatch({ type: 'SET_THEME', theme: next })
    toast(`${THEME_LABEL[next]} theme`, 'success')
  }

  const ThemeIcon = theme === 'light' ? IconSun : theme === 'dark' ? IconMoon : IconContrast

  const createTask = () => {
    if (!onBoard) nav('/board')
    dispatch({ type: 'SET_VIEW', view: 'kanban' })
    const first = state.board.columns[0]
    if (first) {
      dispatch({ type: 'ADD_TASK', columnId: first.id, title: 'New task' })
      toast('Task created', 'success')
    }
  }

  return (
    <header className="topbar" role="banner">
      {isMobile && (
        <button className="btn btn--icon btn--ghost" aria-label="Open menu" onClick={() => ui.setMobileNavOpen(true)}>
          <IconMenu />
        </button>
      )}

      {onBoard && !isMobile && (
        <div className="viewswitch" role="tablist" aria-label="View">
          {VIEWS.map((v) => {
            const Icon = v.icon
            const active = state.prefs.view === v.id
            return (
              <button
                key={v.id}
                role="tab"
                aria-selected={active}
                className={clsx('viewswitch__btn', { 'viewswitch__btn--active': active })}
                onClick={() => dispatch({ type: 'SET_VIEW', view: v.id })}
              >
                {active && (
                  <motion.span layoutId="viewswitch-pill" className="viewswitch__pill" transition={{ type: 'spring', stiffness: 480, damping: 36 }} />
                )}
                <span className="viewswitch__inner">
                  <Icon size={16} />
                  <span className="viewswitch__label">{v.label}</span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {onBoard && <FilterBar />}
      {!onBoard && <div className="topbar__title">HCI notes</div>}

      <div className="topbar__actions">
        <button
          className="topbar__cmd"
          onClick={() => ui.setPaletteOpen(true)}
          aria-label="Open command palette"
          title="Command palette"
        >
          <IconCommand size={15} />
          <span className="topbar__cmd-label">Commands</span>
          <kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} K</kbd>
        </button>

        <button className="btn btn--icon btn--ghost" onClick={cycleTheme} aria-label={`Theme: ${THEME_LABEL[theme]}. Click to change.`} title={`Theme: ${THEME_LABEL[theme]}`}>
          <ThemeIcon size={18} />
        </button>

        {onBoard && (
          <button className="btn btn--primary topbar__new" onClick={createTask}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
            <span className="topbar__new-label">New</span>
          </button>
        )}
      </div>
    </header>
  )
}
