import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useFilteredTasks } from '../../hooks/useFilteredBoard'
import { priorityMeta } from '../../lib/format'
import type { Task } from '../../types'
import './calendar.css'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function ymd(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

export function CalendarView({ onOpenTask }: { onOpenTask: (id: string) => void }) {
  const tasks = useFilteredTasks()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })

  const { cells, monthLabel } = useMemo(() => {
    const year = cursor.getFullYear()
    const month = cursor.getMonth()
    const first = new Date(year, month, 1)
    // Monday-first offset
    const startOffset = (first.getDay() + 6) % 7
    const gridStart = new Date(year, month, 1 - startOffset)

    const byDay = new Map<string, Task[]>()
    tasks.forEach((t) => {
      if (!t.dueDate) return
      const d = new Date(t.dueDate)
      const key = ymd(d)
      const arr = byDay.get(key) ?? []
      arr.push(t)
      byDay.set(key, arr)
    })

    const todayKey = ymd(new Date())
    const cells = Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart)
      date.setDate(gridStart.getDate() + i)
      const key = ymd(date)
      return {
        date,
        key,
        inMonth: date.getMonth() === month,
        isToday: key === todayKey,
        tasks: byDay.get(key) ?? [],
      }
    })

    const monthLabel = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    return { cells, monthLabel }
  }, [cursor, tasks])

  const shift = (delta: number) => {
    const d = new Date(cursor)
    d.setMonth(d.getMonth() + delta)
    setCursor(d)
  }
  const goToday = () => {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    setCursor(d)
  }

  const scheduled = tasks.filter((t) => t.dueDate).length

  return (
    <div className="calendar">
      <div className="calendar__toolbar">
        <div className="calendar__nav">
          <button className="btn btn--icon btn--sm" onClick={() => shift(-1)} aria-label="Previous month">
            <Chevron dir="left" />
          </button>
          <h2 className="calendar__month" aria-live="polite">
            {monthLabel}
          </h2>
          <button className="btn btn--icon btn--sm" onClick={() => shift(1)} aria-label="Next month">
            <Chevron dir="right" />
          </button>
          <button className="btn btn--sm" onClick={goToday}>
            Today
          </button>
        </div>
        <span className="calendar__count">{scheduled} scheduled</span>
      </div>

      <div className="calendar__weekdays" aria-hidden="true">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>

      <div className="calendar__grid" role="grid" aria-label={monthLabel}>
        {cells.map((cell) => (
          <div
            key={cell.key}
            role="gridcell"
            className={clsx('calcell', {
              'calcell--out': !cell.inMonth,
              'calcell--today': cell.isToday,
            })}
          >
            <div className="calcell__num">
              <span className={cell.isToday ? 'calcell__today-badge' : undefined}>{cell.date.getDate()}</span>
            </div>
            <div className="calcell__tasks">
              {cell.tasks.slice(0, 4).map((t) => (
                <motion.button
                  key={t.id}
                  className="calchip"
                  style={{ borderLeftColor: priorityMeta[t.priority].color }}
                  onClick={() => onOpenTask(t.id)}
                  whileHover={{ x: 2 }}
                  title={t.title}
                >
                  <span className="calchip__dot" style={{ background: priorityMeta[t.priority].color }} aria-hidden="true" />
                  <span className="calchip__title">{t.title}</span>
                </motion.button>
              ))}
              {cell.tasks.length > 4 && <span className="calcell__more">+{cell.tasks.length - 4} more</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Chevron({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={dir === 'left' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
