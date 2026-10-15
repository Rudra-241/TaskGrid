import { AnimatePresence, motion } from 'framer-motion'
import { useStore } from '../store/store'
import { KanbanBoard } from '../views/kanban/KanbanBoard'
import { ListView } from '../views/list/ListView'
import { CalendarView } from '../views/calendar/CalendarView'
import { TimelineView } from '../views/timeline/TimelineView'
import './board-page.css'

export function BoardPage() {
  const { state, dispatch } = useStore()
  const view = state.prefs.view
  const openTask = (id: string) => dispatch({ type: 'SELECT_TASK', taskId: id })

  return (
    <div className="board-page">
      <AnimatePresence mode="wait">
        <motion.div
          key={view}
          className="board-page__view"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
        >
          {view === 'kanban' && <KanbanBoard onOpenTask={openTask} />}
          {view === 'list' && <ListView onOpenTask={openTask} />}
          {view === 'calendar' && <CalendarView onOpenTask={openTask} />}
          {view === 'timeline' && <TimelineView onOpenTask={openTask} />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
