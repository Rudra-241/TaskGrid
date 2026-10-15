// Bridge to the Electron shell (see electron/preload.cts). It is only present
// when TaskGrid runs as the desktop app; in a normal browser it is null and
// every caller must degrade gracefully.

export type WidgetKind = 'agenda' | 'glance' | 'focus'

export interface DesktopBridge {
  platform: 'darwin' | 'win32' | 'linux' | string
  /** Bring the main window forward and open a task in the inspector. */
  openTask: (taskId: string) => void
  /** Bring the main window forward. */
  openApp: () => void
  /** Hide the widget this call comes from. */
  closeWidget: () => void
  /** Whether the calling widget floats above other windows. */
  getPinned: () => Promise<boolean>
  setPinned: (pinned: boolean) => Promise<boolean>
  /** Main window only: subscribe to "open this task" requests from widgets. */
  onOpenTask: (handler: (taskId: string) => void) => () => void
}

declare global {
  interface Window {
    taskgridDesktop?: DesktopBridge
  }
}

export const desktop: DesktopBridge | null = window.taskgridDesktop ?? null
