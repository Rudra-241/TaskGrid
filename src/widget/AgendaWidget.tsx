import { useState } from 'react'
import clsx from 'clsx'
import { useStore } from '../store/store'
import { desktop } from '../desktop'
import { priorityMeta } from '../lib/format'
import { IconCheck, IconPlus } from '../components/icons'
import { WidgetFrame } from './WidgetFrame'
import { UndoBar } from './UndoBar'
import { useComplete } from './useComplete'
import { agenda, agendaGroupLabel, findInboxColumn, openTasks } from './selectors'

/** "Up next": open tasks by urgency, tick to complete, quick-add at the bottom. */
export function AgendaWidget() {
  const { state, dispatch } = useStore()
  const { complete, undo, last } = useComplete()
  const [draft, setDraft] = useState('')

  const groups = agenda(state.board)
  const openCount = openTasks(state.board).length
  const inbox = findInboxColumn(state.board.columns)

  const add = (e: React.FormEvent) => {
    e.preventDefault()
    const title = draft.trim()
    if (!title || !inbox) return
    dispatch({ type: 'ADD_TASK', columnId: inbox.id, title })
    setDraft('')
  }

  return (
    <WidgetFrame
      title="Up next"
      meta={`${openCount} open`}
      footer={
        inbox && (
          <form className="widget-add" onSubmit={add}>
            <IconPlus size={15} />
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Add to ${inbox.title}…`}
              aria-label={`New task title, added to ${inbox.title}`}
            />
          </form>
        )
      }
    >
      {groups.length === 0 ? (
        <p className="widget-empty">Nothing open. Enjoy the quiet.</p>
      ) : (
        groups.map(({ group, items }) => (
          <div key={group} className="agenda__group">
            <h2 className={clsx('agenda__label', `agenda__label--${group}`)}>
              {agendaGroupLabel[group]}
              <span>{items.length}</span>
            </h2>
            <ul>
              {items.map(({ task, columnId, due }) => {
                const p = priorityMeta[task.priority]
                return (
                  <li key={task.id} className="agenda__row">
                    <button
                      className="agenda__check"
                      style={{ '--p': p.color } as React.CSSProperties}
                      onClick={() => complete(task.id, columnId)}
                      aria-label={`Mark “${task.title}” done`}
                    >
                      <IconCheck size={12} />
                    </button>
                    <button
                      className="agenda__title"
                      onClick={() => desktop?.openTask(task.id)}
                      disabled={!desktop}
                      title={desktop ? 'Open in TaskGrid' : undefined}
                    >
                      {task.title}
                    </button>
                    <span className="agenda__meta">
                      <span className="agenda__dot" style={{ background: p.color }} aria-hidden="true" />
                      <span className="sr-only">{p.label} priority</span>
                      {due && <span className={clsx('agenda__due', `agenda__due--${due.tone}`)}>{due.label}</span>}
                    </span>
                  </li>
                )
              })}
            </ul>
          </div>
        ))
      )}
      <UndoBar title={last?.title ?? null} onUndo={undo} />
    </WidgetFrame>
  )
}
