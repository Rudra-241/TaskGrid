import { useEffect, useState } from 'react'
import { StoreProvider, useStore } from '../store/store'
import { desktop, type WidgetKind } from '../desktop'
import { AgendaWidget } from './AgendaWidget'
import { GlanceWidget } from './GlanceWidget'
import { FocusWidget } from './FocusWidget'
import './widget.css'

const widgets: Record<WidgetKind, () => React.JSX.Element> = {
  agenda: AgendaWidget,
  glance: GlanceWidget,
  focus: FocusWidget,
}

function readKind(): WidgetKind {
  const w = new URLSearchParams(window.location.search).get('w')
  return w && w in widgets ? (w as WidgetKind) : 'agenda'
}

function WidgetRoot({ kind }: { kind: WidgetKind }) {
  const { state } = useStore()
  const theme = state.prefs.theme

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    root.setAttribute('data-density', 'cozy')
    root.setAttribute('data-platform', desktop?.platform ?? 'web')
  }, [theme])

  // Widgets stay open for days; re-render each minute so "Today" and
  // "overdue" labels roll over at midnight.
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000)
    return () => window.clearInterval(id)
  }, [])

  const Widget = widgets[kind]
  return <Widget />
}

export function WidgetApp() {
  const [kind] = useState(readKind)
  return (
    <StoreProvider>
      <WidgetRoot kind={kind} />
    </StoreProvider>
  )
}
