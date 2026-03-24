import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import AppLayout from '@/components/layout/AppLayout'
import RequireRole from '@/components/auth/RequireRole'
import Login from '@/pages/auth/Login'
import AttentionQueue from '@/pages/AttentionQueue'
import StudentDashboard from '@/pages/StudentDashboard'
import SignalIntake from '@/pages/SignalIntake'
import StudentList from '@/pages/StudentList'
import SchoolList from '@/pages/SchoolList'
import ScoringAlgorithm from '@/pages/ScoringAlgorithm'
import AdminSettings from '@/pages/AdminSettings'
import SeedDemo from '@/pages/SeedDemo'
import { SIM_ALL_ACCESS, SIM_WRITE_ACCESS } from '@/lib/constants'

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<Navigate to="/queue" replace />} />
          <Route path="queue" element={<RequireRole allowedRoles={SIM_ALL_ACCESS}><AttentionQueue /></RequireRole>} />
          <Route path="student/:studentId" element={<RequireRole allowedRoles={SIM_ALL_ACCESS}><StudentDashboard /></RequireRole>} />
          <Route path="signal" element={<RequireRole allowedRoles={SIM_WRITE_ACCESS}><SignalIntake /></RequireRole>} />
          <Route path="signal/:studentId" element={<RequireRole allowedRoles={SIM_WRITE_ACCESS}><SignalIntake /></RequireRole>} />
          <Route path="students" element={<RequireRole allowedRoles={SIM_ALL_ACCESS}><StudentList /></RequireRole>} />
          <Route path="schools" element={<RequireRole allowedRoles={SIM_ALL_ACCESS}><SchoolList /></RequireRole>} />
          <Route path="settings/scoring" element={<RequireRole allowedRoles={SIM_ALL_ACCESS}><ScoringAlgorithm /></RequireRole>} />
          <Route path="settings/admin" element={<RequireRole allowedRoles={SIM_ALL_ACCESS}><AdminSettings /></RequireRole>} />
          <Route path="settings/seed" element={<RequireRole allowedRoles={SIM_ALL_ACCESS}><SeedDemo /></RequireRole>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
