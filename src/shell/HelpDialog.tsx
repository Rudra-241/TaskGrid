import { useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useUi } from '../store/ui'
import { useFocusTrap } from '../hooks/useFocusTrap'
import { IconClose } from '../components/icons'
import './help.css'

const mod = navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'

const GROUPS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: 'General',
    items: [
      { keys: [mod, 'K'], label: 'Open command palette' },
      { keys: ['/'], label: 'Focus search' },
      { keys: ['N'], label: 'New task' },
      { keys: ['A'], label: 'Open AI assistant' },
      { keys: ['?'], label: 'This shortcuts panel' },
      { keys: ['Esc'], label: 'Close panel or dialog' },
    ],
  },
  {
    title: 'Navigate views',
    items: [
      { keys: ['G', 'B'], label: 'Go to board' },
      { keys: ['G', 'L'], label: 'Go to list' },
      { keys: ['G', 'C'], label: 'Go to calendar' },
      { keys: ['G', 'T'], label: 'Go to timeline' },
    ],
  },
  {
    title: 'On a task card',
    items: [
      { keys: ['Enter'], label: 'Open task details' },
      { keys: ['Space'], label: 'Pick up to drag (keyboard)' },
      { keys: ['↑', '↓'], label: 'Move card while dragging' },
      { keys: ['Esc'], label: 'Cancel drag' },
    ],
  },
]

export function HelpDialog() {
  const ui = useUi()
  const open = ui.helpOpen
  const close = () => ui.setHelpOpen(false)
  const ref = useRef<HTMLDivElement>(null)
  useFocusTrap(ref, open, close)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="help__scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
          onClick={close}
        >
          <motion.div
            ref={ref}
            className="help"
            role="dialog"
            aria-modal="true"
            aria-labelledby="help-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="help__head">
              <h2 id="help-title">Keyboard shortcuts</h2>
              <button className="btn btn--icon btn--ghost" onClick={close} aria-label="Close">
                <IconClose size={18} />
              </button>
            </header>
            <div className="help__body">
              {GROUPS.map((g) => (
                <section key={g.title} className="help__group">
                  <h3 className="help__group-title">{g.title}</h3>
                  <ul>
                    {g.items.map((item) => (
                      <li key={item.label} className="help__row">
                        <span className="help__label">{item.label}</span>
                        <span className="help__keys">
                          {item.keys.map((k, i) => (
                            <kbd key={i}>{k}</kbd>
                          ))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
