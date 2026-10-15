interface Props {
  title: string | null
  onUndo: () => void
}

/** Polite live region so completing a task is announced and reversible. */
export function UndoBar({ title, onUndo }: Props) {
  return (
    <div className="widget-undo" role="status" aria-live="polite">
      {title && (
        <>
          <span className="widget-undo__text">
            Done: <strong>{title}</strong>
          </span>
          <button className="widget-undo__btn" onClick={onUndo}>
            Undo
          </button>
        </>
      )}
    </div>
  )
}
