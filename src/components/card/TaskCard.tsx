import { memo } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import type { Task } from '../../types'
import { useStore } from '../../store/store'
import { checklistProgress, formatDue, priorityMeta } from '../../lib/format'
import './TaskCard.css'

interface Props {
  task: Task
  onOpen: (id: string) => void
  selected?: boolean
  dragging?: boolean
  /** Rendered as a drag overlay clone (no interactions). */
  overlay?: boolean
  compactHint?: boolean
}

function TaskCardBase({ task, onOpen, selected, dragging, overlay }: Props) {
  const { state } = useStore()
  const fields = state.prefs.cardFields
  const showTooltips = state.prefs.showTooltips

  const due = fields.dueDate ? formatDue(task.dueDate) : null
  const prog = checklistProgress(task.checklist)
  const pMeta = priorityMeta[task.priority]

  const doneCount = prog.total > 0 && prog.done === prog.total

  return (
    <motion.article
      layout={!overlay}
      layoutId={overlay ? undefined : `card-${task.id}`}
      className={clsx('taskcard', {
        'taskcard--selected': selected,
        'taskcard--dragging': dragging,
        'taskcard--overlay': overlay,
        'taskcard--done': doneCount,
      })}
      style={{ '--card-priority': pMeta.color } as React.CSSProperties}
      onClick={() => onOpen(task.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(task.id)
        }
      }}
      tabIndex={overlay ? -1 : 0}
      role="button"
      aria-pressed={selected}
      aria-label={`${task.title}. Priority ${pMeta.label}.${due ? ` Due ${due.label}.` : ''}${
        prog.total ? ` Checklist ${prog.done} of ${prog.total} done.` : ''
      }`}
      whileHover={overlay ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    >
      <span className="taskcard__priority-bar" aria-hidden="true" />

      <div className="taskcard__head">
        {fields.priority && (
          <span
            className="taskcard__pri"
            style={{ background: pMeta.soft, color: 'var(--text)' }}
            title={showTooltips ? `${pMeta.label} priority` : undefined}
          >
            <span className="taskcard__pri-dot" style={{ background: pMeta.color }} aria-hidden="true" />
            {pMeta.label}
          </span>
        )}
        {fields.dueDate && due && (
          <span className={clsx('taskcard__due', `taskcard__due--${due.tone}`)}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
              <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            {due.label}
          </span>
        )}
      </div>

      <h3 className="taskcard__title">{task.title}</h3>

      {fields.description && task.description && (
        <p className="taskcard__desc">{task.description}</p>
      )}

      {fields.checklist && prog.total > 0 && (
        <div className="taskcard__progress" aria-hidden="true">
          <div className="taskcard__progress-track">
            <motion.div
              className="taskcard__progress-fill"
              initial={false}
              animate={{ width: `${prog.pct}%` }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            />
          </div>
          <span className="taskcard__progress-label">
            {prog.done}/{prog.total}
          </span>
        </div>
      )}

      {fields.tags && task.tags.length > 0 && (
        <ul className="taskcard__tags">
          {task.tags.map((tag) => (
            <li key={tag} className="chip taskcard__tag">
              {tag}
            </li>
          ))}
        </ul>
      )}
    </motion.article>
  )
}

export const TaskCard = memo(TaskCardBase)
