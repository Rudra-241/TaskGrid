import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { desktop } from '../desktop'
import { useStore } from '../store/store'

/**
 * Desktop app only: when a widget asks to open a task, show it in the
 * inspector. The inspector is turned back on if the current mode hid it,
 * since the person explicitly asked to see that task.
 */
export function useDesktopOpenTask() {
  const { state, dispatch } = useStore()
  const nav = useNavigate()
  const loc = useLocation()

  const ctx = useRef({ showInspector: state.prefs.showInspector, path: loc.pathname })
  useEffect(() => {
    ctx.current = { showInspector: state.prefs.showInspector, path: loc.pathname }
  }, [state.prefs.showInspector, loc.pathname])

  useEffect(() => {
    if (!desktop) return
    return desktop.onOpenTask((taskId) => {
      const { showInspector, path } = ctx.current
      if (!(path.startsWith('/board') || path === '/')) nav('/board')
      if (!showInspector) dispatch({ type: 'SET_PREF', patch: { showInspector: true } })
      dispatch({ type: 'SELECT_TASK', taskId })
    })
  }, [dispatch, nav])
}
