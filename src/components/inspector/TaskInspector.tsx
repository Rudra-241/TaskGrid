import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../../store/store'
import { useToast } from '../Toaster'
import { PRIORITIES, priorityMeta, toDateInputValue, fromDateInputValue, checklistProgress } from '../../lib/format'
import type { Priority } from '../../types'
import './TaskInspector.css'

export function TaskInspector() {
  const { state, dispatch } = useStore()
  const { toast } = useToast()
  const task = state.selectedTaskId ? state.board.tasks[state.selectedTaskId] : null
  const [tagDraft, setTagDraft] = useState('')
  const [checkDraft, setCheckDraft] = useState('')
  const titleRef = useRef<HTMLTextAreaElement>(null)

  // Which column holds this task (shown in the header).
  const column = task ? state.board.columns.find((c) => c.taskIds.includes(task.id)) : null

  useEffect(() => {
    setTagDraft('')
    setCheckDraft('')
  }, [task?.id])

  if (!task) return null
  const prog = checklistProgress(task.checklist)

  const close = () => dispatch({ type: 'SELECT_TASK', taskId: null })

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase()
    if (!t) return
    if (!task.tags.includes(t)) {
      dispatch({ type: 'UPDATE_TASK', taskId: task.id, patch: { tags: [...task.tags, t] } })
    }
    setTagDraft('')
  }

  return (
    <AnimatePresence>
      <motion.aside
        key="inspector"
        className="inspector"
        role="complementary"
        aria-label="Task details"
        initial={{ x: 380, opacity: 0.5 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 380, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 340, damping: 36 }}
      >
        <header className="inspector__head">
          <span className="inspector__crumb">{column?.title ?? 'Task'}</span>
          <button className="btn btn--icon btn--ghost" onClick={close} aria-label="Close details" title="Close (Esc)">
            <CloseIcon />
          </button>
        </header>

        <div className="inspector__body">
          <label className="field">
            <span className="field__label">Title</span>
            <textarea
              ref={titleRef}
              className="input inspector__title-input"
              value={task.title}
              rows={2}
              onChange={(e) => dispatch({ type: 'UPDATE_TASK', taskId: task.id, patch: { title: e.target.value } })}
            />
          </label>

          <label className="field">
            <span className="field__label">Description</span>
            <textarea
              className="input"
              placeholder="Add more detail…"
              value={task.description}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_TASK', taskId: task.id, patch: { description: e.target.value } })
              }
            />
          </label>

          <div className="field">
            <span className="field__label">Priority</span>
            <div className="inspector__priorities" role="radiogroup" aria-label="Priority">
              {PRIORITIES.map((p) => (
                <PriorityButton
                  key={p}
                  p={p}
                  active={task.priority === p}
                  onClick={() => dispatch({ type: 'UPDATE_TASK', taskId: task.id, patch: { priority: p } })}
                />
              ))}
            </div>
          </div>

          <label className="field">
            <span className="field__label">Due date</span>
            <input
              type="date"
              className="input"
              value={toDateInputValue(task.dueDate)}
              onChange={(e) =>
                dispatch({ type: 'UPDATE_TASK', taskId: task.id, patch: { dueDate: fromDateInputValue(e.target.value) } })
              }
            />
          </label>

          <div className="field">
            <span className="field__label">Tags</span>
            {task.tags.length > 0 && (
              <ul className="inspector__tags">
                {task.tags.map((tag) => (
                  <li key={tag} className="chip inspector__tag">
                    {tag}
                    <button
                      className="inspector__tag-x"
                      aria-label={`Remove tag ${tag}`}
                      onClick={() =>
                        dispatch({
                          type: 'UPDATE_TASK',
                          taskId: task.id,
                          patch: { tags: task.tags.filter((t) => t !== tag) },
                        })
                      }
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="inspector__tag-add">
              <input
                className="input btn--sm"
                placeholder="Add a tag…"
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addTag()
                  }
                }}
              />
              <button className="btn btn--sm" onClick={addTag}>
                Add
              </button>
            </div>
          </div>

          <div className="field">
            <div className="inspector__check-head">
              <span className="field__label">Checklist</span>
              {prog.total > 0 && (
                <span className="inspector__check-count">
                  {prog.done}/{prog.total}
                </span>
              )}
            </div>
            <ul className="inspector__checklist">
              {task.checklist.map((item) => (
                <li key={item.id} className="checkrow">
                  <label className="checkrow__label">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => dispatch({ type: 'TOGGLE_CHECK', taskId: task.id, itemId: item.id })}
                    />
                    <span className="checkrow__box" aria-hidden="true">
                      <CheckIcon />
                    </span>
                    <span className={item.done ? 'checkrow__text checkrow__text--done' : 'checkrow__text'}>
                      {item.text}
                    </span>
                  </label>
                  <button
                    className="checkrow__del"
                    aria-label={`Delete "${item.text}"`}
                    onClick={() => dispatch({ type: 'DELETE_CHECK', taskId: task.id, itemId: item.id })}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="inspector__tag-add">
              <input
                className="input btn--sm"
                placeholder="Add a step…"
                value={checkDraft}
                onChange={(e) => setCheckDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && checkDraft.trim()) {
                    e.preventDefault()
                    dispatch({ type: 'ADD_CHECK', taskId: task.id, text: checkDraft.trim() })
                    setCheckDraft('')
                  }
                }}
              />
              <button
                className="btn btn--sm"
                onClick={() => {
                  if (checkDraft.trim()) {
                    dispatch({ type: 'ADD_CHECK', taskId: task.id, text: checkDraft.trim() })
                    setCheckDraft('')
                  }
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <footer className="inspector__foot">
          <button
            className="btn inspector__delete"
            onClick={() => {
              dispatch({ type: 'DELETE_TASK', taskId: task.id })
              toast('Task deleted', 'info')
            }}
          >
            <TrashIcon /> Delete task
          </button>
        </footer>
      </motion.aside>
    </AnimatePresence>
  )
}

function PriorityButton({ p, active, onClick }: { p: Priority; active: boolean; onClick: () => void }) {
  const meta = priorityMeta[p]
  return (
    <button
      role="radio"
      aria-checked={active}
      className={active ? 'prio prio--active' : 'prio'}
      style={active ? { background: meta.soft, borderColor: meta.color } : undefined}
      onClick={onClick}
    >
      <span className="prio__dot" style={{ background: meta.color }} aria-hidden="true" />
      {meta.label}
    </button>
  )
}

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 12l5 5L20 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M5 7h14M10 7V5a1 1 0 011-1h2a1 1 0 011 1v2M6 7l1 12a1 1 0 001 1h8a1 1 0 001-1l1-12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)
