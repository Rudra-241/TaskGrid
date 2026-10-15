import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { StoreProvider } from './store/store'
import { UiProvider } from './store/ui'
import { ToasterProvider } from './components/Toaster'
import { AppShell } from './shell/AppShell'
import { BoardPage } from './pages/BoardPage'
import { AboutPage } from './pages/AboutPage'

export default function App() {
  return (
    <StoreProvider>
      <UiProvider>
        <ToasterProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<BoardPage />} />
                <Route path="board" element={<BoardPage />} />
                <Route path="about" element={<AboutPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </ToasterProvider>
      </UiProvider>
    </StoreProvider>
  )
}
