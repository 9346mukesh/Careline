import { BrowserRouter, Route, Routes } from 'react-router-dom'

import AppShell from './components/AppShell'
import ClinicDataProvider from './context/ClinicDataProvider'
import ToastProvider from './context/ToastProvider'
import VoiceCallProvider from './context/VoiceCallProvider'
import AppointmentsPage from './pages/AppointmentsPage'
import DoctorsPage from './pages/DoctorsPage'
import NotFoundPage from './pages/NotFoundPage'
import OverviewPage from './pages/OverviewPage'
import VoicePage from './pages/VoicePage'
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ClinicDataProvider>
          <VoiceCallProvider>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<OverviewPage />} />
                <Route path="doctors" element={<DoctorsPage />} />
                <Route path="appointments" element={<AppointmentsPage />} />
                <Route path="voice" element={<VoicePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </VoiceCallProvider>
        </ClinicDataProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
