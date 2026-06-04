import Link from 'next/link'
import { notFound } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppNavbar } from '@/components/layout/app-navbar'
import { MapPin, BedDouble, User, Calendar } from 'lucide-react'
import { ProjectTabs } from '@/components/projects/project-tabs'

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function ProjectLayout({ children, params }: Props) {
  const { id } = await params
  const session = await auth()

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session!.user!.id },
    include: {
      client: true,
      phases: {
        include: { tasks: { select: { status: true } } },
      },
      paymentDraws: { orderBy: { order: 'asc' } },
      variations: { where: { status: 'PENDING' }, select: { id: true } },
      _count: { select: { photos: true } },
    },
  })

  if (!project) notFound()

  // Stats
  const allTasks = project.phases.flatMap((p) => p.tasks)
  const overallProgress =
    allTasks.length > 0
      ? Math.round(
          (allTasks.filter((t) => t.status === 'COMPLETE').length / allTasks.length) * 100,
        )
      : 0

  const paidTotal = project.paymentDraws
    .filter((d) => d.status === 'PAID')
    .reduce((s, d) => s + d.amount, BigInt(0))

  const nextDraw = project.paymentDraws.find((d) => d.status !== 'PAID')

  const daysRemaining =
    project.targetEndDate
      ? Math.max(
          0,
          Math.ceil(
            (new Date(project.targetEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
          ),
        )
      : null

  const pendingVOs = project.variations.length
  const photoCount = project._count.photos

  const statusColor = {
    ACTIVE: '#27ae60',
    PLANNING: '#3182ce',
    ON_HOLD: '#dd6b20',
    COMPLETE: '#718096',
  }[project.status]

  const statusLabel = {
    ACTIVE: 'On Track',
    PLANNING: 'Planning',
    ON_HOLD: 'On Hold',
    COMPLETE: 'Complete',
  }[project.status]

  const tabs = [
    { href: `/projects/${id}`, label: 'Overview' },
    { href: `/projects/${id}/schedule`, label: 'Schedule' },
    { href: `/projects/${id}/boq`, label: 'BOQ' },
    { href: `/projects/${id}/budget`, label: 'Budget' },
    { href: `/projects/${id}/photos`, label: 'Photos', badge: photoCount > 0 ? String(photoCount) : null },
    { href: `/projects/${id}/variations`, label: 'Variations', badge: pendingVOs > 0 ? String(pendingVOs) : null, badgeOrange: true },
    { href: `/projects/${id}/documents`, label: 'Documents' },
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AppNavbar>
        <Link
          href="/projects"
          className="text-[13px] text-ink-light no-underline hover:text-ink"
        >
          Projects
        </Link>
        <span className="text-[13px] text-border">/</span>
        <span className="truncate text-[13px] font-medium text-ink">{project.name}</span>
      </AppNavbar>

      {/* Hero */}
      <div style={{ background: 'var(--navy)', padding: '16px 24px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: 'white', margin: 0 }}>
                {project.name}
              </h1>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: '600',
                  background: `${statusColor}30`,
                  color: project.status === 'ACTIVE' ? '#5ce08a' : statusColor,
                }}
              >
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                {statusLabel}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              {project.location && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={11} /> {project.location}
                </span>
              )}
              {project.bedrooms && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BedDouble size={11} /> {project.bedrooms} Bedrooms
                </span>
              )}
              {project.client && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <User size={11} /> {project.client.name}
                </span>
              )}
              {project.startDate && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={11} />
                  Started {new Date(project.startDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '1px',
            background: 'rgba(255,255,255,0.06)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <HeroStat label="Progress" value={`${overallProgress}%`} progressPct={overallProgress} />
          <HeroStat label="Contract" value={`Rp ${formatIDR(project.contractValue)}`} />
          <HeroStat label="Paid" value={`Rp ${formatIDR(paidTotal)}`} />
          <HeroStat
            label="Days Left"
            value={daysRemaining !== null ? String(daysRemaining) : '—'}
            sub={
              project.targetEndDate
                ? new Date(project.targetEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'No end date'
            }
          />
          <HeroStat
            label="Next Payment"
            value={nextDraw ? `Rp ${formatIDR(nextDraw.amount)}` : 'All paid'}
            sub={nextDraw?.title}
            highlight={!!nextDraw}
          />
        </div>
      </div>

      {/* Tabs */}
      <ProjectTabs tabs={tabs} />

      {/* Page content */}
      {children}
    </div>
  )
}

function HeroStat({
  label,
  value,
  sub,
  progressPct,
  highlight,
}: {
  label: string
  value: string
  sub?: string | null
  progressPct?: number
  highlight?: boolean
}) {
  return (
    <div style={{ padding: '10px 14px', background: 'rgba(255,255,255,0.04)' }}>
      <div style={{ fontSize: '10px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'rgba(255,255,255,0.4)', marginBottom: '3px' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', fontWeight: '700', color: highlight ? 'var(--yellow)' : 'white', marginBottom: '2px' }}>
        {value}
      </div>
      {progressPct !== undefined && (
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden', marginBottom: '2px' }}>
          <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--yellow)', borderRadius: '2px' }} />
        </div>
      )}
      {sub && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>{sub}</div>}
    </div>
  )
}

function formatIDR(amount: bigint): string {
  const n = Number(amount)
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(0) + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K'
  return n.toLocaleString()
}
