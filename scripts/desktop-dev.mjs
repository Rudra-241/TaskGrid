// Starts the Vite dev server, compiles the Electron main/preload, and launches
// Electron against the dev server so React changes hot-reload in every window.

import { spawn, spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { createServer } from 'vite'

const require = createRequire(import.meta.url)

const tsc = spawnSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.electron.json'], {
  stdio: 'inherit',
})
if (tsc.status !== 0) process.exit(tsc.status ?? 1)

const server = await createServer()
await server.listen()
server.printUrls()

const electron = spawn(require('electron'), ['.'], {
  stdio: 'inherit',
  env: { ...process.env, VITE_DEV_SERVER_URL: server.resolvedUrls.local[0] },
})
electron.on('exit', async (code) => {
  await server.close()
  process.exit(code ?? 0)
})
