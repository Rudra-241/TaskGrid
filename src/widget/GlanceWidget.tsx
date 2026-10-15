import clsx from 'clsx'
import { useStore } from '../store/store'
import { boardStats } from './selectors'
import { WidgetFrame } from './WidgetFrame'

const R = 34
const C = 2 * Math.PI * R

/** "Board": overall progress, what is due, and how work is spread over columns. */
export function GlanceWidget() {
  const { state } = useStore()
  const s = boardStats(state.board)
  const max = Math.max(1, ...s.columns.map((c) => c.count))

  return (
    <WidgetFrame title="Board" meta={`${s.total} tasks`}>
      <div className="glance__top">
        <svg className="glance__ring" viewBox="0 0 84 84" role="img" aria-label={`${s.pct}% of tasks done`}>
          <circle cx="42" cy="42" r={R} className="glance__ring-track" />
          <circle
            cx="42"
            cy="42"
            r={R}
            className="glance__ring-fill"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - s.pct / 100)}
          />
          <text x="42" y="42" className="glance__ring-pct">
            {s.pct}%
          </text>
          <text x="42" y="56" className="glance__ring-sub">
            done
          </text>
        </svg>

        <dl className="glance__stats">
          <div className={clsx('glance__stat', s.overdue > 0 && 'glance__stat--alert')}>
            <dt>Overdue</dt>
            <dd>{s.overdue}</dd>
          </div>
          <div className="glance__stat">
            <dt>Due today</dt>
            <dd>{s.today}</dd>
          </div>
          <div className="glance__stat">
            <dt>Next 7 days</dt>
            <dd>{s.week}</dd>
          </div>
        </dl>
      </div>

      <ul className="glance__cols" aria-label="Tasks per column">
        {s.columns.map((c) => (
          <li key={c.id} className="glance__col">
            <span className="glance__col-name">{c.title}</span>
            <span className="glance__col-bar" aria-hidden="true">
              <span style={{ width: `${(c.count / max) * 100}%`, background: c.accent ?? 'var(--primary)' }} />
            </span>
            <span className="glance__col-count">{c.count}</span>
          </li>
        ))}
      </ul>
    </WidgetFrame>
  )
}
