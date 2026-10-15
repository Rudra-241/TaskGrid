import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/store'
import { useUi } from '../store/ui'
import { useFocusTrap } from '../hooks/useFocusTrap'
import type { Density, Preferences, ThemeId } from '../types'
import { getApiKey, setApiKey } from '../lib/ai/apiKey'
import { IconClose } from '../components/icons'
import './settings.css'

const DENSITIES: { id: Density; label: string; blurb: string }[] = [
  { id: 'comfortable', label: 'Comfortable', blurb: 'Generous spacing' },
  { id: 'cozy', label: 'Cozy', blurb: 'Balanced' },
  { id: 'compact', label: 'Compact', blurb: 'Maximum density' },
]
const THEMES: { id: ThemeId; label: string }[] = [
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
  { id: 'contrast', label: 'High contrast' },
]
const CARD_FIELDS: { id: keyof Preferences['cardFields']; label: string }[] = [
  { id: 'priority', label: 'Priority' },
  { id: 'dueDate', label: 'Due date' },
  { id: 'tags', label: 'Tags' },
  { id: 'checklist', label: 'Checklist progress' },
  { id: 'description', label: 'Description preview' },
]

export function SettingsPanel() {
  const { state, dispatch, reset } = useStore()
  const ui = useUi()
  const panelRef = useRef<HTMLDivElement>(null)
  const open = ui.settingsOpen
  const close = () => ui.setSettingsOpen(false)
  useFocusTrap(panelRef, open, close)
  const p = state.prefs
  const [apiKey, setApiKeyState] = useState(getApiKey)

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="settings__scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={close}
        >
          <motion.div
            ref={panelRef}
            className="settings"
            role="dialog"
            aria-modal="true"
            aria-label="Settings"
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', stiffness: 340, damping: 36 }}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="settings__head">
              <h2>Customize workspace</h2>
              <button className="btn btn--icon btn--ghost" onClick={close} aria-label="Close settings">
                <IconClose size={18} />
              </button>
            </header>

            <div className="settings__body">
              <Section title="Theme">
                <div className="seg">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      className={p.theme === t.id ? 'seg__btn seg__btn--on' : 'seg__btn'}
                      aria-pressed={p.theme === t.id}
                      onClick={() => dispatch({ type: 'SET_THEME', theme: t.id })}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Density" hint="How tightly cards and rows are packed.">
                <div className="settings__tiles">
                  {DENSITIES.map((d) => (
                    <button
                      key={d.id}
                      className={p.density === d.id ? 'dtile dtile--on' : 'dtile'}
                      aria-pressed={p.density === d.id}
                      onClick={() => dispatch({ type: 'SET_DENSITY', density: d.id })}
                    >
                      <span className="dtile__preview" data-d={d.id} aria-hidden="true">
                        <i /> <i /> <i />
                      </span>
                      <span className="dtile__label">{d.label}</span>
                      <span className="dtile__blurb">{d.blurb}</span>
                    </button>
                  ))}
                </div>
              </Section>

              <Section title="Card fields" hint="Choose what each task card shows.">
                <div className="settings__switches">
                  {CARD_FIELDS.map((f) => (
                    <Toggle
                      key={f.id}
                      label={f.label}
                      checked={p.cardFields[f.id]}
                      onChange={(v) => dispatch({ type: 'SET_CARD_FIELD', field: f.id, value: v })}
                    />
                  ))}
                </div>
              </Section>

              <Section title="Panels & interaction">
                <div className="settings__switches">
                  <Toggle
                    label="Sidebar"
                    checked={p.showSidebar}
                    onChange={(v) => dispatch({ type: 'SET_PREF', patch: { showSidebar: v } })}
                  />
                  <Toggle
                    label="Details panel"
                    hint="Open a side panel when a task is selected"
                    checked={p.showInspector}
                    onChange={(v) => dispatch({ type: 'SET_PREF', patch: { showInspector: v } })}
                  />
                  <Toggle
                    label="Tooltips"
                    checked={p.showTooltips}
                    onChange={(v) => dispatch({ type: 'SET_PREF', patch: { showTooltips: v } })}
                  />
                  <Toggle
                    label="Animations"
                    hint="Turn off to reduce motion"
                    checked={p.animationsEnabled}
                    onChange={(v) => dispatch({ type: 'SET_PREF', patch: { animationsEnabled: v } })}
                  />
                </div>
              </Section>

              <Section
                title="AI assistant"
                hint="Chat to add tasks, make columns, and reshape the board. Requires a Google Gemini API key."
              >
                <label className="settings__field">
                  <span className="settings__field-label">Gemini API key</span>
                  <input
                    className="settings__text-input"
                    type="password"
                    autoComplete="off"
                    placeholder="AIza…"
                    value={apiKey}
                    onChange={(e) => {
                      setApiKeyState(e.target.value)
                      setApiKey(e.target.value)
                    }}
                    aria-label="Gemini API key"
                  />
                </label>
                <p className="settings__note">
                  Stored only in this browser and sent directly to Google. Get a free key at{' '}
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
                    aistudio.google.com
                  </a>
                  . For a demo/study — not production, where a key belongs on a server.
                </p>
              </Section>

              <Section title="Workspace data">
                <button
                  className="btn settings__reset"
                  onClick={() => {
                    if (confirm('Reset the workspace to the sample board? This clears your tasks.')) {
                      reset()
                      close()
                    }
                  }}
                >
                  Reset to sample data
                </button>
                <p className="settings__note">
                  Everything is saved locally in this browser. Nothing leaves your device.
                </p>
              </Section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="settings__section">
      <h3 className="settings__section-title">{title}</h3>
      {hint && <p className="settings__section-hint">{hint}</p>}
      {children}
    </section>
  )
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string
  hint?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="toggle">
      <span className="toggle__text">
        <span className="toggle__label">{label}</span>
        {hint && <span className="toggle__hint">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={checked ? 'switch switch--on' : 'switch'}
        onClick={() => onChange(!checked)}
      >
        <span className="switch__knob" />
      </button>
    </label>
  )
}
