import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUi } from '../../store/ui'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { fuzzyScore } from '../../lib/fuzzy'
import { useCommands, type Command } from './useCommands'
import './palette.css'

export function CommandPalette() {
  const ui = useUi()
  const open = ui.paletteOpen
  const close = () => ui.setPaletteOpen(false)
  const commands = useCommands(close)

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useFocusTrap(panelRef, open, close)

  useEffect(() => {
    if (open) {
      setQuery('')
      setActive(0)
      // Focus the search input rather than the first focusable node.
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [open])

  const results = useMemo(() => {
    if (!query.trim()) return commands
    const scored = commands
      .map((c) => {
        const titleScore = fuzzyScore(c.title, query)
        const metaScore = fuzzyScore(`${c.keywords ?? ''} ${c.group}`, query) - 60
        // "Jump to task" entries are demoted so real actions surface first,
        // unless the query clearly matches the task title.
        const penalty = c.group === 'Tasks' && c.hint === 'Open task' ? 120 : 0
        return { c, score: Math.max(titleScore, metaScore) - penalty }
      })
      .filter((r) => r.score > -1)
      .sort((a, b) => b.score - a.score)
    return scored.map((r) => r.c)
  }, [commands, query])

  useEffect(() => setActive(0), [query])

  // Group results while preserving order.
  const groups = useMemo(() => {
    const map = new Map<string, Command[]>()
    results.forEach((c) => {
      const arr = map.get(c.group) ?? []
      arr.push(c)
      map.set(c.group, arr)
    })
    // Flatten to an ordered [command, index] structure for arrow nav.
    const flat: Command[] = []
    map.forEach((arr) => arr.forEach((c) => flat.push(c)))
    return { map, flat }
  }, [results])

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((a) => Math.min(a + 1, groups.flat.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      groups.flat[active]?.run()
    } else if (e.key === 'Home') {
      setActive(0)
    } else if (e.key === 'End') {
      setActive(groups.flat.length - 1)
    }
  }

  // Keep the active row scrolled into view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active])

  let runningIndex = -1

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="palette__scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={close}
        >
          <motion.div
            ref={panelRef}
            className="palette"
            role="dialog"
            aria-modal="true"
            aria-label="Command palette"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 460, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
          >
            <div className="palette__search">
              <SearchIcon />
              <input
                ref={inputRef}
                className="palette__input"
                placeholder="Type a command or search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Command search"
                aria-activedescendant={groups.flat[active] ? `cmd-${groups.flat[active].id}` : undefined}
                aria-controls="palette-list"
                role="combobox"
                aria-expanded="true"
              />
              <kbd>Esc</kbd>
            </div>

            <ul id="palette-list" ref={listRef} className="palette__list" role="listbox" aria-label="Commands">
              {groups.flat.length === 0 && <li className="palette__empty">No matching commands</li>}
              {[...groups.map.entries()].map(([group, items]) => (
                <li key={group} role="presentation">
                  <div className="palette__group">{group}</div>
                  <ul role="presentation">
                    {items.map((c) => {
                      runningIndex += 1
                      const idx = runningIndex
                      const isActive = idx === active
                      return (
                        <li
                          key={c.id}
                          id={`cmd-${c.id}`}
                          role="option"
                          aria-selected={isActive}
                          data-idx={idx}
                          className={isActive ? 'palette__item palette__item--active' : 'palette__item'}
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => c.run()}
                        >
                          <span className="palette__item-title">{c.title}</span>
                          {c.hint && <span className="palette__item-hint">{c.hint}</span>}
                          {c.shortcut && <kbd className="palette__item-kbd">{c.shortcut}</kbd>}
                        </li>
                      )
                    })}
                  </ul>
                </li>
              ))}
            </ul>

            <footer className="palette__foot">
              <span>
                <kbd>↑</kbd>
                <kbd>↓</kbd> navigate
              </span>
              <span>
                <kbd>↵</kbd> run
              </span>
              <span>
                <kbd>Esc</kbd> close
              </span>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20l-3.2-3.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
