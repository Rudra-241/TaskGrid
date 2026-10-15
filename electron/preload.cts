// Exposes a small, explicit API to the renderer as `window.taskgridDesktop`.
// Its shape is mirrored by DesktopBridge in src/desktop.ts.

import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron'

contextBridge.exposeInMainWorld('taskgridDesktop', {
  platform: process.platform,
  openTask: (taskId: string) => ipcRenderer.send('open-task', taskId),
  openApp: () => ipcRenderer.send('open-app'),
  closeWidget: () => ipcRenderer.send('widget:close'),
  getPinned: (): Promise<boolean> => ipcRenderer.invoke('widget:get-pinned'),
  setPinned: (pinned: boolean): Promise<boolean> => ipcRenderer.invoke('widget:set-pinned', pinned),
  onOpenTask: (handler: (taskId: string) => void) => {
    const listener = (_e: IpcRendererEvent, taskId: string) => handler(taskId)
    ipcRenderer.on('open-task', listener)
    return () => {
      ipcRenderer.off('open-task', listener)
    }
  },
})
