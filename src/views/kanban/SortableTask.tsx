import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Task } from '../../types'
import { TaskCard } from '../../components/card/TaskCard'

interface Props {
  task: Task
  columnId: string
  onOpen: (id: string) => void
  selected: boolean
}

export function SortableTask({ task, columnId, onOpen, selected }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', columnId },
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="sortable-task">
      <TaskCard task={task} onOpen={onOpen} selected={selected} dragging={isDragging} />
    </div>
  )
}
