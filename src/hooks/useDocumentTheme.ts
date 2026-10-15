import { useEffect } from 'react'
import { useStore } from '../store/store'

/**
 * Reflects theme, density, experience mode, and motion preference onto the
 * <html> element so the CSS custom-property cascade can pick them up.
 */
export function useDocumentTheme() {
  const { state } = useStore()
  const { theme, density, mode, animationsEnabled } = state.prefs

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.setAttribute('data-density', density)
    root.setAttribute('data-mode', mode)
    root.setAttribute('data-motion', animationsEnabled ? 'on' : 'off')
  }, [theme, density, mode, animationsEnabled])
}
