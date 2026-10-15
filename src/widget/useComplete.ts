import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../store/store'
import { findDoneColumn } from './selectors'

interface Completed {
  taskId: string
  title: string
  from: string
  index: number
}

const UNDO_MS = 5000

/** Move a task to the done column, with a short window to undo it. */
export function useComplete() {
  const { state, dispatch } = useStore()
  const [last, setLast] = useState<Completed | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const complete = useCallback(
    (taskId: string, fromColumnId: string) => {
      const done = findDoneColumn(state.board.columns)
      const from = state.board.columns.find((c) => c.id === fromColumnId)
      const task = state.board.tasks[taskId]
      if (!done || !from || !task || done.id === from.id) return
      dispatch({ type: 'MOVE_TASK', taskId, from: from.id, to: done.id, toIndex: 0 })
      setLast({ taskId, title: task.title, from: from.id, index: from.taskIds.indexOf(taskId) })
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setLast(null), UNDO_MS)
    },
    [state.board, dispatch],
  )

  const undo = useCallback(() => {
    const done = findDoneColumn(state.board.columns)
    if (!last || !done) return
    dispatch({ type: 'MOVE_TASK', taskId: last.taskId, from: done.id, to: last.from, toIndex: last.index })
    window.clearTimeout(timer.current)
    setLast(null)
  }, [last, state.board.columns, dispatch])

  return { complete, undo, last }
}
