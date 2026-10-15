import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/store'
import { useFocusTrap } from '../hooks/useFocusTrap'
import type { ExperienceMode } from '../types'
import { IconLogo, IconSparkle, IconBolt, IconTarget, IconCommand, IconKanban } from '../components/icons'
import './onboarding.css'

interface Step {
  icon: React.FC<{ size?: number }>
  title: string
  body: string
}

const STEPS: Step[] = [
  {
    icon: IconLogo,
    title: 'Welcome to TaskGrid',
    body: 'An adaptive workspace for organising work. Drag tasks, switch views, and shape the interface around how you work.',
  },
  {
    icon: IconKanban,
    title: 'Four ways to see your work',
    body: 'Move between a Kanban board, list, calendar, and timeline. Every view reads from the same tasks, so nothing gets out of sync.',
  },
  {
    icon: IconCommand,
    title: 'Keyboard-first when you want it',
    body: 'Press the command key and K to open the command palette. Search actions, jump to a task, or switch modes without touching the mouse.',
  },
]

const MODES: { id: ExperienceMode; label: string; icon: React.FC<{ size?: number }>; blurb: string }[] = [
  { id: 'new', label: 'Guided', icon: IconSparkle, blurb: 'Roomy layout with tooltips. Best for a first look.' },
  { id: 'power', label: 'Power user', icon: IconBolt, blurb: 'Dense cards and shortcuts for speed.' },
  { id: 'focus', label: 'Focus', icon: IconTarget, blurb: 'Panels hidden so only the work shows.' },
]

export function Onboarding() {
  const { state, dispatch } = useStore()
  const panelRef = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const open = !state.prefs.onboardingDone
  const isModeStep = step === STEPS.length

  const finish = () => dispatch({ type: 'FINISH_ONBOARDING' })
  useFocusTrap(panelRef, open, finish)

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length))
  const back = () => setStep((s) => Math.max(s - 1, 0))

  const totalDots = STEPS.length + 1

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="onb__scrim"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={panelRef}
            className="onb"
            role="dialog"
            aria-modal="true"
            aria-labelledby="onb-title"
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <button className="onb__skip" onClick={finish}>
              Skip
            </button>

            <div className="onb__stage">
              <AnimatePresence mode="wait">
                {!isModeStep ? (
                  <motion.div
                    key={step}
                    className="onb__panel"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="onb__icon">{stepIcon(STEPS[step].icon)}</div>
                    <h2 id="onb-title" className="onb__title">
                      {STEPS[step].title}
                    </h2>
                    <p className="onb__body">{STEPS[step].body}</p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="modes"
                    className="onb__panel"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <h2 id="onb-title" className="onb__title">
                      Pick a starting mode
                    </h2>
                    <p className="onb__body">You can switch anytime from the sidebar or command palette.</p>
                    <div className="onb__modes">
                      {MODES.map((m) => {
                        const Icon = m.icon
                        const active = state.prefs.mode === m.id
                        return (
                          <button
                            key={m.id}
                            className={active ? 'onb-mode onb-mode--active' : 'onb-mode'}
                            aria-pressed={active}
                            onClick={() => dispatch({ type: 'SET_MODE', mode: m.id })}
                          >
                            <span className="onb-mode__icon">
                              <Icon size={20} />
                            </span>
                            <span className="onb-mode__label">{m.label}</span>
                            <span className="onb-mode__blurb">{m.blurb}</span>
                          </button>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="onb__foot">
              <div className="onb__dots" aria-hidden="true">
                {Array.from({ length: totalDots }).map((_, i) => (
                  <span key={i} className={i === step ? 'onb__dot onb__dot--on' : 'onb__dot'} />
                ))}
              </div>
              <div className="onb__nav">
                {step > 0 && (
                  <button className="btn" onClick={back}>
                    Back
                  </button>
                )}
                {!isModeStep ? (
                  <button className="btn btn--primary" onClick={next}>
                    Next
                  </button>
                ) : (
                  <button className="btn btn--primary" onClick={finish}>
                    Start using TaskGrid
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function stepIcon(Icon: React.FC<{ size?: number }>) {
  return <Icon size={30} />
}
