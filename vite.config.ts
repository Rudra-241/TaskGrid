import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      // The desktop widgets are a second page that shares the app's storage.
      input: {
        main: 'index.html',
        widget: 'widget.html',
      },
    },
  },
})
