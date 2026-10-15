import { createContext, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import type { AppState } from '../types'
import { defaultPrefs, makeSeedBoard } from '../data/seed'
import type { Action } from './actions'
import { reducer } from './reducer'

const STORAGE_KEY = 'taskgrid.v1'

function freshState(): AppState {
  return {
    board: makeSeedBoard(),
    prefs: defaultPrefs,
    filters: { query: '', priorities: [], tags: [] },
    selectedTaskId: null,
  }
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return freshState()
    const parsed = JSON.parse(raw) as Partial<AppState>
    const base = freshState()
    // Shallow-merge so newly added preference keys still get defaults.
    return {
      board: parsed.board ?? base.board,
      prefs: { ...base.prefs, ...parsed.prefs, cardFields: { ...base.prefs.cardFields, ...parsed.prefs?.cardFields } },
      filters: { ...base.filters, ...parsed.filters },
      selectedTaskId: null,
    }
  } catch {
    return freshState()
  }
}

interface StoreValue {
  state: AppState
  dispatch: (action: Action) => void
  reset: () => void
}

const StoreContext = createContext<StoreValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)
  const saveTimer = useRef<number | undefined>(undefined)

  // Debounced persistence so rapid drag operations do not thrash localStorage.
  useEffect(() => {
    window.clearTimeout(saveTimer.current)
    saveTimer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch {
        // storage full or unavailable; fail quietly
      }
    }, 250)
    return () => window.clearTimeout(saveTimer.current)
  }, [state])

  // Other windows (browser tabs, desktop widgets) write the same key. The
  // `storage` event only fires in the windows that did not write, so adopting
  // the change here keeps every window in step. Skipping no-op updates stops
  // two windows from echoing each other's filters back and forth.
  const latest = useRef(state)
  useEffect(() => {
    latest.current = state
  }, [state])
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return
      try {
        const incoming = JSON.parse(e.newValue) as Partial<AppState>
        if (!incoming.board || !incoming.prefs) return
        const cur = latest.current
        if (
          JSON.stringify(incoming.board) === JSON.stringify(cur.board) &&
          JSON.stringify(incoming.prefs) === JSON.stringify(cur.prefs)
        ) {
          return
        }
        dispatch({ type: 'SYNC_EXTERNAL', board: incoming.board, prefs: { ...cur.prefs, ...incoming.prefs } })
      } catch {
        // malformed write from elsewhere; ignore it
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const value = useMemo<StoreValue>(
    () => ({
      state,
      dispatch,
      reset: () => {
        localStorage.removeItem(STORAGE_KEY)
        dispatch({ type: 'HYDRATE', state: freshState() })
      },
    }),
    [state],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore(): StoreValue {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within StoreProvider')
  return ctx
}
