import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getDefaultRoute } from '@/lib/constants'
import type { SIMRole } from '@/lib/database.types'

interface RequireRoleProps {
  children: React.ReactNode
  allowedRoles: SIMRole[]
}

/**
 * Layout-route guard component.
 *
 * Usage in App.tsx:
 *   <Route path="admin" element={<RequireRole allowedRoles={['platform_admin']}><Outlet /></RequireRole>}>
 *     <Route path="users" element={<UserManagement />} />
 *   </Route>
 *
 * - Shows a loading spinner while auth state resolves.
 * - Redirects to /login if there is no session.
 * - Redirects to the default route if the role is not in allowedRoles.
 * - Renders children (containing <Outlet />) when authorized.
 */
export default function RequireRole({ children, allowedRoles }: RequireRoleProps) {
  const { session, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  // If profile has loaded and the role isn't allowed, redirect to the user's home
  if (profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to={getDefaultRoute()} replace />
  }

  // Profile still loading (rare edge case — useAuth sets loading=true during fetch)
  if (!profile) return null

  return <>{children}</>
}
