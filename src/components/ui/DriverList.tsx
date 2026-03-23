import type { TopDriver } from '@/lib/database.types'

import { ALL_CATEGORIES } from '@/lib/constants'

type DriverListProps = {
  drivers: TopDriver[]
}

export function DriverList({ drivers }: DriverListProps) {
  return (
    <div className="space-y-2">
      {drivers.map((driver) => {
        const category = ALL_CATEGORIES.find((c) => c.key === driver.category)
        const label = category?.label ?? driver.label

        return (
          <div key={driver.category} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5">
                <span className="text-gray-700 font-medium">{label}</span>
                <span className="inline-flex items-center rounded px-1 py-0.5 text-[10px] font-semibold uppercase leading-none bg-gray-100 text-gray-500">
                  {driver.index_type}
                </span>
              </span>
              <span className="text-gray-500 tabular-nums">
                {driver.contribution_pct.toFixed(0)}%
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-500 rounded-full transition-all"
                style={{ width: `${Math.min(driver.contribution_pct, 100)}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
