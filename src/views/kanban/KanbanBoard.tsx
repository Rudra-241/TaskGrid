import { useMemo, useRef, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type Announcements,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { useStore } from '../../store/store'
import { useFilteredBoard } from '../../hooks/useFilteredBoard'
import { TaskCard } from '../../components/card/TaskCard'
import { Column } from './Column'
import './kanban.css'

export function KanbanBoard({ onOpenTask }: { onOpenTask: (id: string) => void }) {
  const { state, dispatch } = useStore()
  const { visibleByColumn } = useFilteredBoard()
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null)
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null)
  // Remember the origin so keyboard-driven moves report a sensible source.
  const originColumn = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const columnIds = useMemo(() => state.board.columns.map((c) => c.id), [state.board.columns])

  const findColumnOfTask = (taskId: string): string | null => {
    const col = state.board.columns.find((c) => c.taskIds.includes(taskId))
    return col?.id ?? null
  }

  const columnTitle = (id: string | null) => state.board.columns.find((c) => c.id === id)?.title ?? ''

  function handleDragStart(e: DragStartEvent) {
    const type = e.active.data.current?.type
    if (type === 'column') {
      setActiveColumnId(String(e.active.id))
    } else {
      const id = String(e.active.id)
      setActiveTaskId(id)
      originColumn.current = findColumnOfTask(id)
    }
  }

  // Live move while dragging so the card visibly relocates between columns.
  function handleDragOver(e: DragOverEvent) {
    const { active, over } = e
    if (!over || active.data.current?.type === 'column') return

    const activeId = String(active.id)
    const from = findColumnOfTask(activeId)
    if (!from) return

    const overData = over.data.current
    let to: string | null = null
    let toIndex = 0

    if (overData?.type === 'column') {
      to = overData.columnId
      to = to ? to : String(over.id)
      const target = state.board.columns.find((c) => c.id === to)
      toIndex = target ? target.taskIds.length : 0
    } else {
      to = findColumnOfTask(String(over.id))
      const target = state.board.columns.find((c) => c.id === to)
      toIndex = target ? target.taskIds.indexOf(String(over.id)) : 0
    }

    if (!to || from === to) return
    dispatch({ type: 'MOVE_TASK', taskId: activeId, from, to, toIndex })
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e
    setActiveTaskId(null)
    setActiveColumnId(null)
    if (!over) return

    // Column reorder
    if (active.data.current?.type === 'column' && over.data.current?.type === 'column') {
      const oldIndex = columnIds.indexOf(String(active.id))
      const newIndex = columnIds.indexOf(String(over.id))
      if (oldIndex !== newIndex && oldIndex > -1 && newIndex > -1) {
        const next = arrayMove(columnIds, oldIndex, newIndex)
        dispatch({ type: 'REORDER_COLUMN', from: oldIndex, to: newIndex })
        void next
      }
      return
    }

    // Card reorder within a column (cross-column moves already happened in dragOver).
    const activeId = String(active.id)
    const from = findColumnOfTask(activeId)
    if (!from) return

    let to = from
    let toIndex = 0
    if (over.data.current?.type === 'column') {
      to = over.data.current.columnId ?? String(over.id)
      const target = state.board.columns.find((c) => c.id === to)
      toIndex = target ? target.taskIds.length : 0
    } else {
      to = findColumnOfTask(String(over.id)) ?? from
      const target = state.board.columns.find((c) => c.id === to)
      toIndex = target ? target.taskIds.indexOf(String(over.id)) : 0
    }
    dispatch({ type: 'MOVE_TASK', taskId: activeId, from, to, toIndex })
  }

  // Screen-reader announcements describing every drag phase.
  const announcements: Announcements = {
    onDragStart({ active }) {
      const t = state.board.tasks[String(active.id)]
      if (t) return `Picked up task ${t.title}. Use arrow keys to move, space to drop, escape to cancel.`
      return `Picked up column ${columnTitle(String(active.id))}.`
    },
    onDragOver({ active, over }) {
      const t = state.board.tasks[String(active.id)]
      if (!over) return undefined
      if (t) {
        const col = over.data.current?.columnId ?? findColumnOfTask(String(over.id))
        return `Task ${t.title} is over ${columnTitle(col)}.`
      }
      return `Column ${columnTitle(String(active.id))} is over ${columnTitle(String(over.id))}.`
    },
    onDragEnd({ active, over }) {
      const t = state.board.tasks[String(active.id)]
      if (t) {
        const col = over ? over.data.current?.columnId ?? findColumnOfTask(String(over.id)) : originColumn.current
        return `Task ${t.title} dropped into ${columnTitle(col)}.`
      }
      return `Column ${columnTitle(String(active.id))} reordered.`
    },
    onDragCancel({ active }) {
      const t = state.board.tasks[String(active.id)]
      return t ? `Move cancelled. ${t.title} returned to its place.` : 'Move cancelled.'
    },
  }

  const activeTask = activeTaskId ? state.board.tasks[activeTaskId] : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{ announcements }}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban" role="list" aria-label="Kanban board">
        <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
          {state.board.columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              visibleTaskIds={visibleByColumn[column.id] ?? []}
              onOpenTask={onOpenTask}
            />
          ))}
        </SortableContext>

        <AddColumn />
      </div>

      <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
        {activeTask ? <TaskCard task={activeTask} onOpen={() => {}} overlay /> : null}
        {activeColumnId ? (
          <div className="column column--overlay">
            <div className="column__head">
              <span className="column__title">{columnTitle(activeColumnId)}</span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

function AddColumn() {
  const { dispatch } = useStore()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  const commit = () => {
    if (draft.trim()) dispatch({ type: 'ADD_COLUMN', title: draft.trim() })
    setDraft('')
    setAdding(false)
  }

  if (!adding) {
    return (
      <button className="kanban__add-col" onClick={() => setAdding(true)} aria-label="Add column">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        Add column
      </button>
    )
  }
  return (
    <div className="kanban__add-col kanban__add-col--form">
      <input
        className="input"
        autoFocus
        placeholder="Column name…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit()
          if (e.key === 'Escape') {
            setDraft('')
            setAdding(false)
          }
        }}
      />
    </div>
  )
}
