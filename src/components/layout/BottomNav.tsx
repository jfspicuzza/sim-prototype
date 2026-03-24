import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, BarChart3, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Dashboard', to: '/queue', icon: LayoutDashboard },
  { label: 'Students', to: '/students', icon: Users },
  { label: 'Reports', to: '/settings/scoring', icon: BarChart3 },
  { label: 'Settings', to: '/settings/admin', icon: Settings },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 md:hidden z-50 safe-bottom">
      <div className="flex items-center justify-around h-16">
        {TABS.map(tab => (
          <NavLink
            key={tab.label}
            to={tab.to}
            end={tab.to === '/queue'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-0.5 w-full h-full text-xs transition-colors',
                isActive ? 'text-brand-600' : 'text-gray-400'
              )
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className={cn('w-5 h-5', isActive ? 'text-brand-600' : 'text-gray-400')} />
                <span className={cn('font-medium', isActive && 'text-brand-600')}>{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
