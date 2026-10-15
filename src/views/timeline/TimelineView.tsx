import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useFilteredTasks } from '../../hooks/useFilteredBoard'
import { checklistProgress, formatDue, priorityMeta } from '../../lib/format'
import type { Task } from '../../types'
import './timeline.css'

interface Group {
  key: string
  label: string
  tone: string
  tasks: Task[]
}

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

export function TimelineView({ onOpenTask }: { onOpenTask: (id: string) => void }) {
  const tasks = useFilteredTasks()

  const groups = useMemo<Group[]>(() => {
    const today = startOfDay(new Date())
    const weekEnd = new Date(today)
    weekEnd.setDate(today.getDate() + 7)

    const buckets: Record<string, Task[]> = { overdue: [], today: [], week: [], later: [], none: [] }

    tasks.forEach((t) => {
      if (!t.dueDate) return buckets.none.push(t)
      const due = startOfDay(new Date(t.dueDate))
      if (due < today) buckets.overdue.push(t)
      else if (due.getTime() === today.getTime()) buckets.today.push(t)
      else if (due < weekEnd) buckets.week.push(t)
      else buckets.later.push(t)
    })

    const byDue = (a: Task, b: Task) => {
      const av = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
      const bv = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
      return av - bv
    }
    Object.values(buckets).forEach((b) => b.sort(byDue))

    const defs: { key: string; label: string; tone: string }[] = [
      { key: 'overdue', label: 'Overdue', tone: 'var(--accent)' },
      { key: 'today', label: 'Today', tone: 'var(--p-high)' },
      { key: 'week', label: 'This week', tone: 'var(--primary)' },
      { key: 'later', label: 'Later', tone: 'var(--secondary)' },
      { key: 'none', label: 'No due date', tone: 'var(--text-faint)' },
    ]
    return defs.map((d) => ({ ...d, tasks: buckets[d.key] })).filter((g) => g.tasks.length > 0)
  }, [tasks])

  if (groups.length === 0) {
    return (
      <div className="view-empty">
        <div className="view-empty__glyph" aria-hidden="true">
          ⏱
        </div>
        <h2>Nothing to plot</h2>
        <p>No tasks match the current search or filters.</p>
      </div>
    )
  }

  return (
    <div className="timeline">
      <div className="timeline__spine" aria-hidden="true" />
      {groups.map((group) => (
        <section key={group.key} className="tgroup" aria-label={group.label}>
          <header className="tgroup__head">
            <span className="tgroup__node" style={{ background: group.tone }} aria-hidden="true" />
            <h2 className="tgroup__label">{group.label}</h2>
            <span className="tgroup__count">{group.tasks.length}</span>
          </header>
          <div className="tgroup__items">
            {group.tasks.map((t, i) => (
              <TimelineCard key={t.id} task={t} index={i} onOpen={onOpenTask} />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function TimelineCard({ task, index, onOpen }: { task: Task; index: number; onOpen: (id: string) => void }) {
  const pMeta = priorityMeta[task.priority]
  const due = formatDue(task.dueDate)
  const prog = checklistProgress(task.checklist)

  return (
    <motion.button
      className="tcard"
      style={{ borderLeftColor: pMeta.color }}
      onClick={() => onOpen(task.id)}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.24 }}
      whileHover={{ x: 3 }}
      aria-label={`${task.title}, ${pMeta.label} priority${due ? `, due ${due.label}` : ''}`}
    >
      <div className="tcard__main">
        <span className="tcard__title">{task.title}</span>
        {task.description && <span className="tcard__desc">{task.description}</span>}
        <div className="tcard__meta">
          <span className="chip" style={{ background: pMeta.soft, color: 'var(--text)' }}>
            {pMeta.label}
          </span>
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="chip tcard__tag">
              {tag}
            </span>
          ))}
          {prog.total > 0 && (
            <span className="tcard__prog">
              {prog.done}/{prog.total} done
            </span>
          )}
        </div>
      </div>
      {due && <span className={`tcard__due tcard__due--${due.tone}`}>{due.label}</span>}
    </motion.button>
  )
}
