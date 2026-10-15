import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

interface UiState {
  paletteOpen: boolean
  setPaletteOpen: (v: boolean) => void
  settingsOpen: boolean
  setSettingsOpen: (v: boolean) => void
  helpOpen: boolean
  setHelpOpen: (v: boolean) => void
  assistantOpen: boolean
  setAssistantOpen: (v: boolean) => void
  mobileNavOpen: boolean
  setMobileNavOpen: (v: boolean) => void
  focusSearch: () => void
  registerSearchFocus: (fn: () => void) => void
}

const UiContext = createContext<UiState | null>(null)

export function UiProvider({ children }: { children: ReactNode }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Kept in a ref so (un)registering the search-focus handler never changes
  // the context value identity, so consumers do not re-render in a loop.
  const searchFocusRef = useRef<() => void>(() => {})
  const focusSearch = useCallback(() => searchFocusRef.current(), [])
  const registerSearchFocus = useCallback((fn: () => void) => {
    searchFocusRef.current = fn
  }, [])

  const value = useMemo<UiState>(
    () => ({
      paletteOpen,
      setPaletteOpen,
      settingsOpen,
      setSettingsOpen,
      helpOpen,
      setHelpOpen,
      assistantOpen,
      setAssistantOpen,
      mobileNavOpen,
      setMobileNavOpen,
      focusSearch,
      registerSearchFocus,
    }),
    [paletteOpen, settingsOpen, helpOpen, assistantOpen, mobileNavOpen, focusSearch, registerSearchFocus],
  )

  return <UiContext.Provider value={value}>{children}</UiContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useUi(): UiState {
  const ctx = useContext(UiContext)
  if (!ctx) throw new Error('useUi must be used within UiProvider')
  return ctx
}
