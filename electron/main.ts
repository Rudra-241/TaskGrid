// TaskGrid desktop shell: the full app in a normal window, plus small
// frameless widgets that sit on the desktop. Every window loads from the same
// origin, so they share localStorage and stay in sync through `storage` events
// (see src/store/store.tsx). There is no separate data layer.

import { app, BrowserWindow, Menu, Tray, ipcMain, nativeImage, net, protocol, screen, shell } from 'electron'
import type { MenuItemConstructorOptions, Rectangle } from 'electron'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

type WidgetKind = 'agenda' | 'glance' | 'focus'

interface WidgetDef {
  label: string
  width: number
  height: number
}

// Sizes include the 8px transparent margin that holds the card's shadow.
const WIDGETS: Record<WidgetKind, WidgetDef> = {
  agenda: { label: 'Up next', width: 356, height: 436 },
  glance: { label: 'Board glance', width: 336, height: 316 },
  focus: { label: 'In progress', width: 356, height: 456 },
}
const KINDS = Object.keys(WIDGETS) as WidgetKind[]

const isMac = process.platform === 'darwin'
const here = import.meta.dirname
const root = path.join(here, '..')
const distDir = path.join(root, 'dist')
const devUrl = process.env.VITE_DEV_SERVER_URL

// ------------------------------------------------------------------ storage

interface WidgetState {
  visible: boolean
  pinned: boolean
  bounds?: Rectangle
}
type Saved = Record<WidgetKind, WidgetState>

const statePath = () => path.join(app.getPath('userData'), 'widgets.json')

function loadSaved(): Saved {
  const fallback: Saved = {
    agenda: { visible: true, pinned: false },
    glance: { visible: false, pinned: false },
    focus: { visible: false, pinned: false },
  }
  try {
    const parsed = JSON.parse(readFileSync(statePath(), 'utf8')) as Partial<Saved>
    for (const k of KINDS) fallback[k] = { ...fallback[k], ...parsed[k] }
  } catch {
    // first run, or unreadable: use defaults
  }
  return fallback
}

let saved: Saved
let saveTimer: NodeJS.Timeout | undefined
function persist() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    try {
      writeFileSync(statePath(), JSON.stringify(saved, null, 2))
    } catch {
      // not fatal: positions just will not be remembered
    }
  }, 300)
}

// ----------------------------------------------------------------- protocol

// A privileged custom scheme gives the packaged app a stable, secure origin
// (file:// would give every page its own storage and break BrowserRouter).
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } },
])

function serveDist() {
  protocol.handle('app', (req) => {
    const { pathname } = new URL(req.url)
    let file = path.normalize(path.join(distDir, decodeURIComponent(pathname)))
    // Unknown paths and directories fall back to the SPA entry; never serve
    // anything outside dist.
    if (!file.startsWith(distDir) || !existsSync(file) || statSync(file).isDirectory()) {
      file = path.join(distDir, 'index.html')
    }
    return net.fetch(pathToFileURL(file).toString())
  })
}

function pageUrl(page: string): string {
  return devUrl ? new URL(page, devUrl).toString() : `app://taskgrid/${page}`
}

// ------------------------------------------------------------------ windows

const preload = path.join(here, 'preload.cjs')
let mainWin: BrowserWindow | null = null
const widgetWins = new Map<WidgetKind, BrowserWindow>()
let tray: Tray | null = null
let quitting = false

function guardNavigation(win: BrowserWindow) {
  // Links (e.g. the Gemini key page in Settings) open in the real browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url)
    return { action: 'deny' }
  })
}

function showMain(): BrowserWindow {
  if (mainWin && !mainWin.isDestroyed()) {
    if (mainWin.isMinimized()) mainWin.restore()
    mainWin.show()
    mainWin.focus()
    return mainWin
  }
  mainWin = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 720,
    minHeight: 520,
    title: 'TaskGrid',
    show: false,
    backgroundColor: '#effcf8',
    icon: path.join(root, 'build', 'icon.png'),
    webPreferences: { preload, contextIsolation: true, sandbox: true },
  })
  guardNavigation(mainWin)
  mainWin.once('ready-to-show', () => mainWin?.show())
  // Closing the main window keeps the app (and its widgets) running in the
  // tray / menu bar; Quit from there exits.
  mainWin.on('close', (e) => {
    if (!quitting) {
      e.preventDefault()
      mainWin?.hide()
    }
  })
  mainWin.on('closed', () => (mainWin = null))
  mainWin.loadURL(pageUrl(''))
  return mainWin
}

function defaultBounds(kind: WidgetKind): Rectangle {
  // Stack widgets down the right edge of the primary display.
  const area = screen.getPrimaryDisplay().workArea
  const def = WIDGETS[kind]
  let y = area.y + 16
  for (const k of KINDS) {
    if (k === kind) break
    y += WIDGETS[k].height
  }
  return { x: area.x + area.width - def.width - 16, y, width: def.width, height: def.height }
}

/** Saved bounds, unless the display they were on is gone. */
function boundsFor(kind: WidgetKind): Rectangle {
  const b = saved[kind].bounds
  if (b) {
    const area = screen.getDisplayMatching(b).workArea
    const onScreen =
      b.x < area.x + area.width && b.x + b.width > area.x && b.y < area.y + area.height && b.y + b.height > area.y
    if (onScreen) return { ...b, width: WIDGETS[kind].width, height: WIDGETS[kind].height }
  }
  return defaultBounds(kind)
}

function openWidget(kind: WidgetKind) {
  const existing = widgetWins.get(kind)
  if (existing && !existing.isDestroyed()) {
    existing.showInactive()
    return
  }
  const win = new BrowserWindow({
    ...boundsFor(kind),
    title: `TaskGrid — ${WIDGETS[kind].label}`,
    frame: false,
    transparent: true,
    hasShadow: false, // the card draws its own
    resizable: false, // transparent windows cannot resize reliably on Windows
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: saved[kind].pinned,
    show: false,
    webPreferences: { preload, contextIsolation: true, sandbox: true },
  })
  if (isMac) win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false })
  guardNavigation(win)

  const remember = () => {
    if (win.isDestroyed()) return
    saved[kind].bounds = win.getBounds()
    persist()
  }
  win.on('moved', remember)
  win.on('closed', () => {
    widgetWins.delete(kind)
    if (!quitting) {
      saved[kind].visible = false
      persist()
      refreshTray()
    }
  })
  win.once('ready-to-show', () => win.showInactive())
  win.loadURL(pageUrl(`widget.html?w=${kind}`))

  widgetWins.set(kind, win)
  saved[kind].visible = true
  persist()
}

function closeWidget(kind: WidgetKind) {
  widgetWins.get(kind)?.close()
}

function kindOf(sender: Electron.WebContents): WidgetKind | undefined {
  for (const [kind, win] of widgetWins) if (win.webContents === sender) return kind
  return undefined
}

// --------------------------------------------------------------------- tray

function trayIcon() {
  // macOS wants a monochrome "template" image it can tint for light/dark menu bars.
  const file = isMac ? 'trayTemplate.png' : 'tray.png'
  const img = nativeImage.createFromPath(path.join(root, 'build', file))
  if (isMac) img.setTemplateImage(true)
  return img
}

function refreshTray() {
  if (!tray) return
  const widgetItems: MenuItemConstructorOptions[] = KINDS.map((kind) => ({
    label: WIDGETS[kind].label,
    type: 'checkbox',
    checked: widgetWins.has(kind),
    click: (item) => {
      if (item.checked) openWidget(kind)
      else closeWidget(kind)
      refreshTray()
    },
  }))
  const supportsLogin = isMac || process.platform === 'win32'
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open TaskGrid', click: () => showMain() },
      { type: 'separator' },
      { label: 'Widgets', enabled: false },
      ...widgetItems,
      { type: 'separator' },
      ...(supportsLogin
        ? [
            {
              label: 'Start at login',
              type: 'checkbox' as const,
              checked: app.getLoginItemSettings().openAtLogin,
              click: (item: Electron.MenuItem) => {
                app.setLoginItemSettings({ openAtLogin: item.checked, args: ['--hidden'] })
              },
            },
            { type: 'separator' as const },
          ]
        : []),
      { label: 'Quit TaskGrid', role: 'quit' },
    ]),
  )
}

// ---------------------------------------------------------------------- ipc

ipcMain.on('open-app', () => showMain())

ipcMain.on('open-task', (_e, taskId: unknown) => {
  if (typeof taskId !== 'string') return
  const win = showMain()
  const send = () => win.webContents.send('open-task', taskId)
  if (win.webContents.isLoading()) win.webContents.once('did-finish-load', send)
  else send()
})

ipcMain.on('widget:close', (e) => {
  const kind = kindOf(e.sender)
  if (kind) closeWidget(kind)
})

ipcMain.handle('widget:get-pinned', (e) => {
  const kind = kindOf(e.sender)
  return kind ? saved[kind].pinned : false
})

ipcMain.handle('widget:set-pinned', (e, pinned: unknown) => {
  const kind = kindOf(e.sender)
  if (!kind) return false
  saved[kind].pinned = Boolean(pinned)
  widgetWins.get(kind)?.setAlwaysOnTop(saved[kind].pinned, 'floating')
  persist()
  return saved[kind].pinned
})

// ---------------------------------------------------------------- lifecycle

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => showMain())

  app.whenReady().then(() => {
    if (!devUrl) serveDist()
    saved = loadSaved()

    tray = new Tray(trayIcon())
    tray.setToolTip('TaskGrid')
    // Windows and Linux: a left click on the tray icon opens the app; macOS
    // shows the menu on click by convention.
    if (!isMac) tray.on('click', () => showMain())

    for (const kind of KINDS) if (saved[kind].visible) openWidget(kind)
    refreshTray()

    const atLogin = process.argv.includes('--hidden') || app.getLoginItemSettings().wasOpenedAtLogin
    if (!atLogin) showMain()

    app.on('activate', () => showMain())
  })

  app.on('before-quit', () => {
    quitting = true
    clearTimeout(saveTimer)
    try {
      writeFileSync(statePath(), JSON.stringify(saved, null, 2))
    } catch {
      // ignore
    }
  })

  // Widgets keep the app alive; only an explicit Quit ends it.
  app.on('window-all-closed', () => {})
}
