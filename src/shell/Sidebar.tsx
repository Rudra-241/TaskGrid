import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { useFilteredBoard } from '../hooks/useFilteredBoard'
import type { ExperienceMode, ViewId } from '../types'
import {
  IconKanban,
  IconList,
  IconCalendar,
  IconTimeline,
  IconLogo,
  IconSettings,
  IconBook,
  IconSparkle,
  IconBolt,
  IconTarget,
} from '../components/icons'
import './sidebar.css'

const VIEWS: { id: ViewId; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'kanban', label: 'Board', icon: IconKanban },
  { id: 'list', label: 'List', icon: IconList },
  { id: 'calendar', label: 'Calendar', icon: IconCalendar },
  { id: 'timeline', label: 'Timeline', icon: IconTimeline },
]

const MODES: { id: ExperienceMode; label: string; icon: React.FC<{ size?: number }>; blurb: string }[] = [
  { id: 'new', label: 'Guided', icon: IconSparkle, blurb: 'Roomy layout, tooltips on' },
  { id: 'power', label: 'Power', icon: IconBolt, blurb: 'Dense, shortcut-driven' },
  { id: 'focus', label: 'Focus', icon: IconTarget, blurb: 'Panels hidden' },
]

export function Sidebar({ mobile = false }: { mobile?: boolean }) {
  const { state, dispatch } = useStore()
  const ui = useUi()
  const nav = useNavigate()
  const loc = useLocation()
  const { totalCount } = useFilteredBoard()
  const onBoard = loc.pathname.startsWith('/board') || loc.pathname === '/'

  const chooseView = (id: ViewId) => {
    dispatch({ type: 'SET_VIEW', view: id })
    if (!onBoard) nav('/board')
    if (mobile) ui.setMobileNavOpen(false)
  }

  return (
    <nav className={clsx('sidebar', { 'sidebar--mobile': mobile })} aria-label="Primary">
      <div className="sidebar__brand">
        <IconLogo size={26} />
        <span className="sidebar__brand-name">TaskGrid</span>
      </div>

      <div className="sidebar__group">
        <span className="sidebar__group-label" id="views-heading">
          Views
        </span>
        <ul aria-labelledby="views-heading">
          {VIEWS.map((v) => {
            const Icon = v.icon
            const active = onBoard && state.prefs.view === v.id
            return (
              <li key={v.id}>
                <button
                  className={clsx('sidebar__link', { 'sidebar__link--active': active })}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => chooseView(v.id)}
                >
                  <Icon size={18} />
                  <span>{v.label}</span>
                  {v.id === 'kanban' && <span className="sidebar__link-count">{totalCount}</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="sidebar__group">
        <span className="sidebar__group-label" id="mode-heading">
          Experience mode
        </span>
        <ul className="sidebar__modes" aria-labelledby="mode-heading">
          {MODES.map((m) => {
            const Icon = m.icon
            const active = state.prefs.mode === m.id
            return (
              <li key={m.id}>
                <button
                  className={clsx('mode-tile', { 'mode-tile--active': active })}
                  aria-pressed={active}
                  onClick={() => {
                    dispatch({ type: 'SET_MODE', mode: m.id })
                    if (mobile) ui.setMobileNavOpen(false)
                  }}
                >
                  <span className="mode-tile__top">
                    <Icon size={16} />
                    <span className="mode-tile__label">{m.label}</span>
                    <AnimatePresence>
                      {active && (
                        <motion.span
                          layoutId={mobile ? undefined : 'mode-dot'}
                          className="mode-tile__dot"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          aria-hidden="true"
                        />
                      )}
                    </AnimatePresence>
                  </span>
                  <span className="mode-tile__blurb">{m.blurb}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="sidebar__spacer" />

      <div className="sidebar__group">
        <ul>
          <li>
            <button
              className="sidebar__link"
              onClick={() => {
                ui.setSettingsOpen(true)
                if (mobile) ui.setMobileNavOpen(false)
              }}
            >
              <IconSettings size={18} />
              <span>Settings</span>
            </button>
          </li>
          <li>
            <NavLink
              to="/about"
              className={({ isActive }) => clsx('sidebar__link', { 'sidebar__link--active': isActive })}
              onClick={() => mobile && ui.setMobileNavOpen(false)}
            >
              <IconBook size={18} />
              <span>HCI notes</span>
            </NavLink>
          </li>
        </ul>
      </div>
    </nav>
  )
}
