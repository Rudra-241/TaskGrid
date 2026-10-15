import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import clsx from 'clsx'
import { useStore } from '../../store/store'
import { useFilteredBoard } from '../../hooks/useFilteredBoard'
import { checklistProgress, formatDue, priorityMeta } from '../../lib/format'
import type { Task } from '../../types'
import './list.css'

type SortKey = 'priority' | 'due' | 'title' | 'none'

export function ListView({ onOpenTask }: { onOpenTask: (id: string) => void }) {
  const { state } = useStore()
  const { visibleByColumn } = useFilteredBoard()
  const [sortKey, setSortKey] = useState<SortKey>('none')
  const [asc, setAsc] = useState(true)

  const rows = useMemo(() => {
    const list: { task: Task; columnTitle: string; accent?: string }[] = []
    state.board.columns.forEach((col) => {
      ;(visibleByColumn[col.id] ?? []).forEach((id) => {
        const task = state.board.tasks[id]
        if (task) list.push({ task, columnTitle: col.title, accent: col.accent })
      })
    })

    if (sortKey !== 'none') {
      list.sort((a, b) => {
        let cmp = 0
        if (sortKey === 'priority') cmp = priorityMeta[a.task.priority].order - priorityMeta[b.task.priority].order
        else if (sortKey === 'title') cmp = a.task.title.localeCompare(b.task.title)
        else if (sortKey === 'due') {
          const av = a.task.dueDate ? new Date(a.task.dueDate).getTime() : Infinity
          const bv = b.task.dueDate ? new Date(b.task.dueDate).getTime() : Infinity
          cmp = av - bv
        }
        return asc ? cmp : -cmp
      })
    }
    return list
  }, [state.board, visibleByColumn, sortKey, asc])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setAsc((v) => !v)
    else {
      setSortKey(key)
      setAsc(true)
    }
  }

  const arrow = (key: SortKey) => (sortKey === key ? (asc ? ' ↑' : ' ↓') : '')

  if (rows.length === 0) return <EmptyList />

  return (
    <div className="listview" role="table" aria-label="Task list">
      <div className="listrow listrow--head" role="row">
        <span role="columnheader" className="listcell listcell--status" />
        <button role="columnheader" className="listcell listcell--title lh" onClick={() => toggleSort('title')}>
          Task{arrow('title')}
        </button>
        <button role="columnheader" className="listcell listcell--pri lh" onClick={() => toggleSort('priority')}>
          Priority{arrow('priority')}
        </button>
        <span role="columnheader" className="listcell listcell--tags">
          Tags
        </span>
        <button role="columnheader" className="listcell listcell--due lh" onClick={() => toggleSort('due')}>
          Due{arrow('due')}
        </button>
        <span role="columnheader" className="listcell listcell--col">
          Column
        </span>
      </div>

      <div className="listview__body">
        {rows.map(({ task, columnTitle, accent }, i) => (
          <ListRow key={task.id} task={task} columnTitle={columnTitle} accent={accent} index={i} onOpen={onOpenTask} selected={state.selectedTaskId === task.id} />
        ))}
      </div>
    </div>
  )
}

function ListRow({
  task,
  columnTitle,
  accent,
  index,
  onOpen,
  selected,
}: {
  task: Task
  columnTitle: string
  accent?: string
  index: number
  onOpen: (id: string) => void
  selected: boolean
}) {
  const pMeta = priorityMeta[task.priority]
  const due = formatDue(task.dueDate)
  const prog = checklistProgress(task.checklist)

  return (
    <motion.div
      role="row"
      className={clsx('listrow', { 'listrow--selected': selected })}
      tabIndex={0}
      aria-label={`${task.title}, ${pMeta.label} priority, in ${columnTitle}`}
      onClick={() => onOpen(task.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(task.id)
        }
      }}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.015, 0.25), duration: 0.2 }}
    >
      <span role="cell" className="listcell listcell--status">
        <span className="listrow__pri-dot" style={{ background: pMeta.color }} aria-hidden="true" />
      </span>
      <span role="cell" className="listcell listcell--title">
        <span className="listrow__title">{task.title}</span>
        {prog.total > 0 && (
          <span className="listrow__prog" aria-hidden="true">
            {prog.done}/{prog.total}
          </span>
        )}
      </span>
      <span role="cell" className="listcell listcell--pri">
        <span className="chip" style={{ background: pMeta.soft, color: 'var(--text)' }}>
          {pMeta.label}
        </span>
      </span>
      <span role="cell" className="listcell listcell--tags">
        {task.tags.slice(0, 3).map((t) => (
          <span key={t} className="chip listrow__tag">
            {t}
          </span>
        ))}
        {task.tags.length > 3 && <span className="listrow__more">+{task.tags.length - 3}</span>}
      </span>
      <span role="cell" className={clsx('listcell listcell--due', due && `listrow__due--${due.tone}`)}>
        {due ? due.label : <span className="listrow__nodate">No date</span>}
      </span>
      <span role="cell" className="listcell listcell--col">
        <span className="listrow__coltag">
          <span className="listrow__coldot" style={{ background: accent }} aria-hidden="true" />
          {columnTitle}
        </span>
      </span>
    </motion.div>
  )
}

function EmptyList() {
  return (
    <div className="view-empty">
      <div className="view-empty__glyph" aria-hidden="true">
        ☑
      </div>
      <h2>Nothing matches</h2>
      <p>No tasks match the current search or filters.</p>
    </div>
  )
}
