import { useEffect } from 'react'

export type Hotkey = {
  combo: string // e.g. "mod+k", "g b", "?", "n"
  handler: (e: KeyboardEvent) => void
  // Allow the hotkey even while typing in an input (rare; default false).
  allowInInput?: boolean
}

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false
  const tag = el.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable
}

function eventCombo(e: KeyboardEvent): string {
  const parts: string[] = []
  if (e.ctrlKey || e.metaKey) parts.push('mod')
  if (e.altKey) parts.push('alt')
  if (e.shiftKey && e.key.length > 1) parts.push('shift')
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase()
  parts.push(key)
  return parts.join('+')
}

/**
 * Global hotkey handler. Supports modifier combos ("mod+k") and simple
 * two-key sequences ("g b") for view navigation, à la many keyboard-first apps.
 */
export function useHotkeys(hotkeys: Hotkey[], enabled = true) {
  useEffect(() => {
    if (!enabled) return

    let sequence = ''
    let seqTimer: number | undefined

    const resetSeq = () => {
      sequence = ''
      window.clearTimeout(seqTimer)
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const typing = isTypingTarget(e.target)
      const combo = eventCombo(e)

      // First, try direct combo / single-key matches.
      for (const hk of hotkeys) {
        if (hk.combo.includes(' ')) continue
        if (typing && !hk.allowInInput) continue
        if (hk.combo === combo) {
          hk.handler(e)
          resetSeq()
          return
        }
      }

      // Then, two-key sequences like "g b". Only single character keys, no mods.
      if (!typing && !e.metaKey && !e.ctrlKey && !e.altKey && e.key.length === 1) {
        sequence = (sequence + e.key.toLowerCase()).slice(-2)
        window.clearTimeout(seqTimer)
        seqTimer = window.setTimeout(resetSeq, 700)
        for (const hk of hotkeys) {
          if (!hk.combo.includes(' ')) continue
          if (hk.combo.replace(' ', '') === sequence) {
            hk.handler(e)
            resetSeq()
            return
          }
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.clearTimeout(seqTimer)
    }
  }, [hotkeys, enabled])
}
