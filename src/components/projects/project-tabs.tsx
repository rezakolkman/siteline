'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Tab {
  href: string
  label: string
  badge?: string | null
  badgeOrange?: boolean
}

export function ProjectTabs({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname()

  return (
    <div
      style={{
        background: 'var(--white)',
        borderBottom: '1px solid var(--border)',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'flex-end',
        flexShrink: 0,
        overflowX: 'auto',
      }}
    >
      {tabs.map((tab) => {
        // active if exact match or if pathname starts with tab.href and tab is not overview
        const isOverview = tab.href.split('/').length === 3 // /projects/[id]
        const isActive = isOverview
          ? pathname === tab.href
          : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            style={{
              padding: '12px 16px 10px',
              fontSize: '13px',
              fontWeight: isActive ? '600' : '500',
              color: isActive ? 'var(--navy)' : 'var(--ink-mid)',
              textDecoration: 'none',
              borderBottom: `2px solid ${isActive ? 'var(--yellow)' : 'transparent'}`,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {tab.label}
            {tab.badge && (
              <span
                style={{
                  background: tab.badgeOrange ? 'var(--orange-bg)' : '#edf2f7',
                  color: tab.badgeOrange ? 'var(--orange)' : 'var(--ink-light)',
                  fontSize: '10.5px',
                  fontWeight: '600',
                  padding: '1px 6px',
                  borderRadius: '10px',
                }}
              >
                {tab.badge}
              </span>
            )}
          </Link>
        )
      })}
    </div>
  )
}
