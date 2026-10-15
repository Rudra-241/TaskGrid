import { useEffect, useState, type ReactNode } from 'react'
import clsx from 'clsx'
import { desktop } from '../desktop'
import { IconClose, IconExternal, IconPin } from '../components/icons'

interface Props {
  title: string
  meta?: ReactNode
  children: ReactNode
  footer?: ReactNode
}

/**
 * Widget chrome: a draggable header with open / pin / hide controls. The
 * controls only appear inside the desktop app; in a browser the widget page
 * renders on its own as a preview.
 */
export function WidgetFrame({ title, meta, children, footer }: Props) {
  const [pinned, setPinned] = useState(false)

  useEffect(() => {
    desktop?.getPinned().then(setPinned)
  }, [])

  const togglePin = async () => {
    if (desktop) setPinned(await desktop.setPinned(!pinned))
  }

  return (
    <section className="widget" aria-label={title}>
      <header className="widget__head">
        <div className="widget__title">
          <h1>{title}</h1>
          {meta && <span className="widget__meta">{meta}</span>}
        </div>
        {desktop && (
          <div className="widget__controls">
            <button
              className="widget__ctl"
              onClick={() => desktop?.openApp()}
              aria-label="Open TaskGrid"
              title="Open TaskGrid"
            >
              <IconExternal size={14} />
            </button>
            <button
              className={clsx('widget__ctl', pinned && 'widget__ctl--on')}
              onClick={togglePin}
              aria-pressed={pinned}
              aria-label="Keep on top"
              title={pinned ? 'Unpin from top' : 'Keep on top'}
            >
              <IconPin size={14} />
            </button>
            <button
              className="widget__ctl"
              onClick={() => desktop?.closeWidget()}
              aria-label="Hide widget"
              title="Hide widget (bring it back from the tray icon)"
            >
              <IconClose size={14} />
            </button>
          </div>
        )}
      </header>
      <div className="widget__body">{children}</div>
      {footer && <footer className="widget__foot">{footer}</footer>}
    </section>
  )
}
