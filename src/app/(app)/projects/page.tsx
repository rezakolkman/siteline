import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppNavbar } from '@/components/layout/app-navbar'
import { MapPin, BedDouble, Calendar, Plus, ArrowRight } from 'lucide-react'
import type { ProjectStatus } from '@/generated/prisma/client'

export default async function ProjectsPage() {
  const session = await auth()
  const userId = session!.user!.id

  const projects = await prisma.project.findMany({
    where: { ownerId: userId },
    include: {
      client: true,
      phases: {
        include: { tasks: true },
      },
      milestones: {
        where: { isComplete: false },
        orderBy: { order: 'asc' },
        take: 1,
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  const totalValue = projects.reduce((sum, p) => sum + p.contractValue, BigInt(0))
  const activeCount = projects.filter((p) => p.status === 'ACTIVE').length

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AppNavbar
        title="Projects"
        actions={
          <Link
            href="/projects/new"
            className="inline-flex items-center gap-1.5 rounded-md bg-yellow px-3.5 py-1.5 text-[13px] font-semibold text-navy no-underline hover:bg-yellow-dark"
          >
            <Plus size={14} />
            New Project
          </Link>
        }
      />

      <div className="min-h-0 flex-1 overflow-auto bg-app-bg px-6 py-5 pb-8">

        {/* Summary strip */}
        {projects.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <SummaryCard label="Active Projects" value={String(activeCount)} navy />
            <SummaryCard label="Total Projects" value={String(projects.length)} />
            <SummaryCard label="Total Build Value" value={`Rp ${formatIDR(totalValue)}`} />
            <SummaryCard label="Completed" value={String(projects.filter(p => p.status === 'COMPLETE').length)} />
          </div>
        )}

        {/* Project grid */}
        {projects.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '14px',
            }}
          >
            {projects.map((project) => {
              const totalTasks = project.phases.reduce((sum, ph) => sum + ph.tasks.length, 0)
              const doneTasks = project.phases.reduce(
                (sum, ph) => sum + ph.tasks.filter((t) => t.status === 'COMPLETE').length,
                0,
              )
              const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
              const nextMilestone = project.milestones[0]

              return (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  status={project.status}
                  location={project.location}
                  bedrooms={project.bedrooms}
                  client={project.client?.name}
                  contractValue={project.contractValue}
                  progress={progress}
                  targetEndDate={project.targetEndDate}
                  nextMilestone={nextMilestone?.name}
                />
              )
            })}
          </div>
        )}

      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  navy,
}: {
  label: string
  value: string
  navy?: boolean
}) {
  return (
    <div
      style={{
        background: navy ? 'var(--navy)' : 'var(--white)',
        border: `1px solid ${navy ? 'var(--navy)' : 'var(--border)'}`,
        borderRadius: '8px',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: '500',
          color: navy ? 'rgba(255,255,255,0.5)' : 'var(--ink-light)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '6px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '20px',
          fontWeight: '700',
          color: navy ? 'var(--yellow)' : 'var(--ink)',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function ProjectCard({
  id,
  name,
  status,
  location,
  bedrooms,
  client,
  contractValue,
  progress,
  targetEndDate,
  nextMilestone,
}: {
  id: string
  name: string
  status: ProjectStatus
  location?: string | null
  bedrooms?: number | null
  client?: string | null
  contractValue: bigint
  progress: number
  targetEndDate?: Date | null
  nextMilestone?: string
}) {
  const statusColor = {
    ACTIVE: '#27ae60',
    PLANNING: '#3182ce',
    ON_HOLD: '#dd6b20',
    COMPLETE: '#718096',
  }[status]

  const statusLabel = {
    ACTIVE: 'Active',
    PLANNING: 'Planning',
    ON_HOLD: 'On Hold',
    COMPLETE: 'Complete',
  }[status]

  return (
    <Link
      href={`/projects/${id}`}
      style={{
        display: 'block',
        background: 'var(--white)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        overflow: 'hidden',
        textDecoration: 'none',
        transition: 'box-shadow 0.15s',
      }}
    >
      {/* Top accent bar */}
      <div style={{ height: '4px', background: statusColor }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '10px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink)', margin: 0 }}>{name}</h2>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 9px',
              borderRadius: '12px',
              fontSize: '11.5px',
              fontWeight: '500',
              background: `${statusColor}18`,
              color: statusColor,
              flexShrink: 0,
            }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '12px',
            color: 'var(--ink-light)',
            marginBottom: '14px',
          }}
        >
          {location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <MapPin size={11} /> {location}
            </span>
          )}
          {bedrooms && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <BedDouble size={11} /> {bedrooms} BR
            </span>
          )}
          {client && <span>{client}</span>}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span style={{ fontSize: '11.5px', color: 'var(--ink-light)' }}>Overall progress</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--ink)' }}>{progress}%</span>
          </div>
          <div style={{ height: '5px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: statusColor,
                borderRadius: '3px',
              }}
            />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-light)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--ink-light)', marginBottom: '2px' }}>Contract</div>
            <div style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--ink)' }}>
              Rp {formatIDR(contractValue)}
            </div>
          </div>
          {targetEndDate && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: 'var(--ink-light)', marginBottom: '2px' }}>Target</div>
              <div style={{ fontSize: '12.5px', fontWeight: '500', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={11} />
                {new Date(targetEndDate).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
              </div>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12.5px',
              fontWeight: '500',
              color: 'var(--navy)',
            }}
          >
            View <ArrowRight size={13} />
          </div>
        </div>

        {nextMilestone && (
          <div
            style={{
              marginTop: '10px',
              padding: '8px 10px',
              background: 'var(--bg)',
              borderRadius: '6px',
              fontSize: '12px',
              color: 'var(--ink-mid)',
            }}
          >
            Next: {nextMilestone}
          </div>
        )}
      </div>
    </Link>
  )
}

function EmptyState() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 24px',
        background: 'var(--white)',
        borderRadius: '10px',
        border: '1px solid var(--border)',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          background: 'var(--yellow-soft)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        <Plus size={24} color="var(--yellow-dark)" />
      </div>
      <h2 style={{ fontSize: '17px', fontWeight: '600', color: 'var(--ink)', marginBottom: '6px' }}>
        No projects yet
      </h2>
      <p style={{ fontSize: '14px', color: 'var(--ink-light)', marginBottom: '24px', maxWidth: '280px' }}>
        Create your first project to start tracking schedules, budgets, and photos.
      </p>
      <Link
        href="/projects/new"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '9px 20px',
          background: 'var(--yellow)',
          color: 'var(--navy)',
          borderRadius: '7px',
          fontSize: '14px',
          fontWeight: '600',
          textDecoration: 'none',
        }}
      >
        <Plus size={15} />
        Create first project
      </Link>
    </div>
  )
}

function formatIDR(amount: bigint): string {
  const num = Number(amount)
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B'
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(0) + 'M'
  if (num >= 1_000) return (num / 1_000).toFixed(0) + 'K'
  return num.toLocaleString()
}
