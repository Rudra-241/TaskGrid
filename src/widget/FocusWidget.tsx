import { useStore } from '../store/store'
import { desktop } from '../desktop'
import { checklistProgress, formatDue, priorityMeta } from '../lib/format'
import { IconCheck } from '../components/icons'
import { WidgetFrame } from './WidgetFrame'
import { UndoBar } from './UndoBar'
import { useComplete } from './useComplete'
import { findActiveColumn } from './selectors'

/** "In progress": the cards being worked on, with their checklists tickable in place. */
export function FocusWidget() {
  const { state, dispatch } = useStore()
  const { complete, undo, last } = useComplete()

  const column = findActiveColumn(state.board.columns)
  const tasks = column ? column.taskIds.map((id) => state.board.tasks[id]).filter(Boolean) : []

  return (
    <WidgetFrame title={column?.title ?? 'In progress'} meta={column ? `${tasks.length} active` : undefined}>
      {!column ? (
        <p className="widget-empty">Add an “In progress” column in TaskGrid to track active work here.</p>
      ) : tasks.length === 0 ? (
        <p className="widget-empty">Nothing in progress. Move a card into {column.title} to see it here.</p>
      ) : (
        <ul className="focus__list">
          {tasks.map((task) => {
            const prog = checklistProgress(task.checklist)
            const due = formatDue(task.dueDate)
            const p = priorityMeta[task.priority]
            return (
              <li key={task.id} className="focus__card" style={{ '--p': p.color } as React.CSSProperties}>
                <div className="focus__head">
                  <button
                    className="focus__title"
                    onClick={() => desktop?.openTask(task.id)}
                    disabled={!desktop}
                    title={desktop ? 'Open in TaskGrid' : undefined}
                  >
                    {task.title}
                  </button>
                  <button
                    className="focus__done"
                    onClick={() => complete(task.id, column.id)}
                    aria-label={`Mark “${task.title}” done`}
                  >
                    <IconCheck size={13} /> Done
                  </button>
                </div>
                <div className="focus__meta">
                  <span>{p.label}</span>
                  {due && <span className={`agenda__due agenda__due--${due.tone}`}>{due.label}</span>}
                  {prog.total > 0 && (
                    <span>
                      {prog.done}/{prog.total}
                    </span>
                  )}
                </div>
                {prog.total > 0 && (
                  <>
                    <div
                      className="focus__bar"
                      role="progressbar"
                      aria-valuenow={prog.pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${task.title} checklist progress`}
                    >
                      <span style={{ width: `${prog.pct}%` }} />
                    </div>
                    <ul className="focus__checks">
                      {task.checklist.map((item) => (
                        <li key={item.id}>
                          <label className={item.done ? 'is-done' : undefined}>
                            <input
                              type="checkbox"
                              checked={item.done}
                              onChange={() => dispatch({ type: 'TOGGLE_CHECK', taskId: task.id, itemId: item.id })}
                            />
                            <span>{item.text}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}
      <UndoBar title={last?.title ?? null} onUndo={undo} />
    </WidgetFrame>
  )
}
