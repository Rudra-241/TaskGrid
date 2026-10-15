import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { nanoid } from 'nanoid'
import { useStore } from '../../store/store'
import { useUi } from '../../store/ui'
import { useToast } from '../Toaster'
import { useFocusTrap } from '../../hooks/useFocusTrap'
import { hasApiKey } from '../../lib/ai/apiKey'
import { runAssistant } from '../../lib/ai/runAssistant'
import { IconSparkle, IconClose } from '../icons'
import './assistant.css'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

const SUGGESTIONS = [
  'Add a task "Prep demo slides" to To do, high priority, due in 2 days',
  'Add a column called "Review"',
  'Move the contrast audit task to Done',
  'Switch to the calendar view',
]

const GREETING =
  "Hi! I'm your board assistant. Tell me what to do — add tasks, make columns, move cards, switch views — and I'll do it for you."

export function AssistantPanel() {
  const { state, dispatch } = useStore()
  const ui = useUi()
  const { toast } = useToast()
  const open = ui.assistantOpen
  const close = () => ui.setAssistantOpen(false)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Always hand the assistant the *latest* state, not a stale render snapshot —
  // it reads state between its own dispatches (e.g. add a task, then patch it).
  const stateRef = useRef(state)
  useEffect(() => {
    stateRef.current = state
  }, [state])

  useFocusTrap(panelRef, open, close)

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus())
  }, [open])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, busy])

  async function send(text: string) {
    const trimmed = text.trim()
    if (!trimmed || busy) return

    if (!hasApiKey()) {
      toast('Add your Gemini API key in Settings to use the assistant.', 'error')
      ui.setSettingsOpen(true)
      return
    }

    const userMsg: ChatMessage = { id: nanoid(6), role: 'user', text: trimmed }
    // History = prior turns (before this message) as plain text pairs.
    const history = messages.map((m) => ({ role: m.role, text: m.text }))
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setBusy(true)

    try {
      const result = await runAssistant(
        trimmed,
        history,
        { getState: () => stateRef.current, dispatch },
      )
      setMessages((prev) => [...prev, { id: nanoid(6), role: 'assistant', text: result.text }])
      if (result.actionsTaken > 0) {
        toast(`Assistant made ${result.actionsTaken} change${result.actionsTaken === 1 ? '' : 's'}`, 'success')
      }
    } catch (err) {
      const message = errorMessage(err)
      setMessages((prev) => [...prev, { id: nanoid(6), role: 'assistant', text: message }])
    } finally {
      setBusy(false)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send(input)
    }
  }

  return (
    <>
      {/* Launcher — always visible, bottom-right */}
      <button
        className="assistant-fab"
        aria-label={open ? 'Close assistant' : 'Open AI assistant'}
        aria-expanded={open}
        onClick={() => ui.setAssistantOpen(!open)}
      >
        <IconSparkle size={22} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            className="assistant"
            role="dialog"
            aria-modal="false"
            aria-label="AI assistant"
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
          >
            <header className="assistant__head">
              <span className="assistant__title">
                <IconSparkle size={18} />
                AI assistant
              </span>
              <button className="btn btn--icon btn--ghost" onClick={close} aria-label="Close assistant">
                <IconClose size={18} />
              </button>
            </header>

            <div className="assistant__log" ref={scrollRef}>
              <div className="assistant__msg assistant__msg--assistant">
                <p>{GREETING}</p>
              </div>

              {messages.length === 0 && (
                <div className="assistant__suggest">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="assistant__chip" onClick={() => void send(s)} disabled={busy}>
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {messages.map((m) => (
                <div key={m.id} className={`assistant__msg assistant__msg--${m.role}`}>
                  <p>{m.text}</p>
                </div>
              ))}

              {busy && (
                <div className="assistant__msg assistant__msg--assistant">
                  <span className="assistant__typing" aria-label="Thinking">
                    <i /> <i /> <i />
                  </span>
                </div>
              )}
            </div>

            <div className="assistant__compose">
              <textarea
                ref={inputRef}
                className="assistant__input"
                placeholder="Ask me to add tasks, columns, move cards…"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                aria-label="Message the assistant"
                disabled={busy}
              />
              <button
                className="btn btn--primary assistant__send"
                onClick={() => void send(input)}
                disabled={busy || !input.trim()}
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function errorMessage(err: unknown): string {
  if (err instanceof Error && err.message === 'NO_API_KEY') {
    return 'I need a Gemini API key first — add one in Settings.'
  }
  const status = (err as { status?: number })?.status
  const message = (err as Error)?.message ?? ''
  if (status === 400 && /API[_ ]?KEY/i.test(message)) {
    return 'That API key was rejected. Check your Gemini key in Settings.'
  }
  if (status === 401 || status === 403) return 'That API key was rejected. Check your Gemini key in Settings.'
  if (status === 429) return "You've hit a rate limit. Wait a moment and try again."
  if (status && status >= 500) return 'The API is having trouble right now. Please try again.'
  return `Sorry — something went wrong. ${message}`.trim()
}
