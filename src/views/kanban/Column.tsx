import { useState } from 'react'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { AnimatePresence, motion } from 'framer-motion'
import clsx from 'clsx'
import type { Column as ColumnType } from '../../types'
import { useStore } from '../../store/store'
import { SortableTask } from './SortableTask'

interface Props {
  column: ColumnType
  visibleTaskIds: string[]
  onOpenTask: (id: string) => void
}

export function Column({ column, visibleTaskIds, onOpenTask }: Props) {
  const { state, dispatch } = useStore()
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')
  const [renaming, setRenaming] = useState(false)
  const [titleDraft, setTitleDraft] = useState(column.title)
  const [menuOpen, setMenuOpen] = useState(false)

  // The column itself is sortable (columns can be reordered).
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    data: { type: 'column' },
  })
  // A droppable zone so cards can land in an empty column.
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `col-drop-${column.id}`,
    data: { type: 'column', columnId: column.id },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const filteredHidden = column.taskIds.length - visibleTaskIds.length

  const commitAdd = () => {
    if (draft.trim()) {
      dispatch({ type: 'ADD_TASK', columnId: column.id, title: draft.trim() })
      setDraft('')
    }
    setAdding(false)
  }

  const commitRename = () => {
    if (titleDraft.trim()) dispatch({ type: 'RENAME_COLUMN', columnId: column.id, title: titleDraft.trim() })
    else setTitleDraft(column.title)
    setRenaming(false)
  }

  return (
    <motion.section
      ref={setNodeRef}
      style={style}
      className={clsx('column', { 'column--over': isOver })}
      aria-label={`${column.title} column, ${visibleTaskIds.length} tasks`}
      layout
    >
      <header className="column__head">
        <span className="column__accent" style={{ background: column.accent }} aria-hidden="true" />
        {renaming ? (
          <input
            className="input column__rename"
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') {
                setTitleDraft(column.title)
                setRenaming(false)
              }
            }}
          />
        ) : (
          <button
            className="column__title"
            {...attributes}
            {...listeners}
            aria-label={`${column.title}. Drag to reorder column.`}
            title="Drag to reorder"
          >
            {column.title}
            <span className="column__count">{visibleTaskIds.length}</span>
          </button>
        )}

        <div className="column__menu-wrap">
          <button
            className="btn btn--icon btn--ghost btn--sm"
            aria-label={`Options for ${column.title}`}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <DotsIcon />
          </button>
          <AnimatePresence>
            {menuOpen && (
              <>
                <div className="column__menu-scrim" onClick={() => setMenuOpen(false)} />
                <motion.div
                  className="column__menu"
                  role="menu"
                  initial={{ opacity: 0, y: -4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.97 }}
                  transition={{ duration: 0.14 }}
                >
                  <button
                    role="menuitem"
                    className="column__menu-item"
                    onClick={() => {
                      setRenaming(true)
                      setMenuOpen(false)
                    }}
                  >
                    Rename
                  </button>
                  <button
                    role="menuitem"
                    className="column__menu-item"
                    onClick={() => {
                      setAdding(true)
                      setMenuOpen(false)
                    }}
                  >
                    Add task
                  </button>
                  <button
                    role="menuitem"
                    className="column__menu-item column__menu-item--danger"
                    onClick={() => {
                      if (column.taskIds.length === 0 || confirm(`Delete "${column.title}" and its tasks?`)) {
                        dispatch({ type: 'DELETE_COLUMN', columnId: column.id })
                      }
                      setMenuOpen(false)
                    }}
                  >
                    Delete column
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </header>

      <div ref={setDropRef} className="column__list">
        <SortableContext items={visibleTaskIds} strategy={verticalListSortingStrategy}>
          {visibleTaskIds.map((id) => (
            <SortableTask
              key={id}
              task={state.board.tasks[id]}
              columnId={column.id}
              onOpen={onOpenTask}
              selected={state.selectedTaskId === id}
            />
          ))}
        </SortableContext>

        {visibleTaskIds.length === 0 && !adding && (
          <div className="column__empty">
            {filteredHidden > 0 ? `${filteredHidden} hidden by filters` : 'Drop tasks here'}
          </div>
        )}
        {filteredHidden > 0 && visibleTaskIds.length > 0 && (
          <div className="column__filtered-note">{filteredHidden} more hidden by filters</div>
        )}

        {adding && (
          <div className="column__add-form">
            <textarea
              className="input"
              autoFocus
              rows={2}
              placeholder="Task title…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitAdd}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  commitAdd()
                }
                if (e.key === 'Escape') {
                  setDraft('')
                  setAdding(false)
                }
              }}
            />
          </div>
        )}
      </div>

      {!adding && (
        <button className="column__add" onClick={() => setAdding(true)}>
          <PlusIcon /> Add task
        </button>
      )}
    </motion.section>
  )
}

const DotsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <circle cx="5" cy="12" r="1.8" />
    <circle cx="12" cy="12" r="1.8" />
    <circle cx="19" cy="12" r="1.8" />
  </svg>
)
const PlusIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
)
