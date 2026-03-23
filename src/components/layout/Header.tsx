import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, initials } from '@/lib/utils'
import { ROLE_LABELS } from '@/lib/constants'
import type { Profile } from '@/lib/database.types'

interface HeaderProps {
  profile: Profile | null
}

export default function Header({ profile }: HeaderProps) {
  const navigate = useNavigate()

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
      {/* Left: breadcrumb / page context */}
      <div className="flex-1" />

      {/* Right: notifications + profile */}
      <div className="flex items-center gap-3">
        <button
          className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        {profile ? (
          <div className="flex items-center gap-2.5">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold',
              'bg-brand-100 text-brand-700'
            )}>
              {initials(profile.full_name)}
            </div>
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900 leading-none">{profile.full_name}</p>
              <p className="text-xs text-gray-500 mt-0.5">{ROLE_LABELS[profile.role] ?? profile.role}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-8 h-8 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-400" />
          </div>
        )}
      </div>
    </header>
  )
}
