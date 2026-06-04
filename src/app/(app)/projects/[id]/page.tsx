import Link from 'next/link'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Camera, GitBranch, CheckCircle2, Clock, Circle } from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProjectOverviewPage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session!.user!.id },
    include: {
      phases: {
        orderBy: { order: 'asc' },
        include: { tasks: true },
      },
      milestones: { orderBy: { order: 'asc' } },
      paymentDraws: { orderBy: { order: 'asc' } },
      variations: { where: { status: 'PENDING' }, select: { id: true } },
      photos: { orderBy: { createdAt: 'desc' }, take: 6 },
      updates: { orderBy: { createdAt: 'desc' }, take: 5 },
      boqItems: { select: { total: true, status: true, isVariation: true } },
    },
  })

  if (!project) return null

  const pendingVOs = project.variations.length

  const approvedVOTotal = project.boqItems
    .filter((i) => i.isVariation && i.status === 'APPROVED')
    .reduce((s, i) => s + i.total, BigInt(0))

  const totalContract = project.contractValue + approvedVOTotal

  const paidTotal = project.paymentDraws
    .filter((d) => d.status === 'PAID')
    .reduce((s, d) => s + d.amount, BigInt(0))

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px', background: 'var(--bg)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '16px', alignItems: 'start' }}>

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {pendingVOs > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                background: 'var(--orange-bg)',
                border: '1px solid rgba(221,107,32,0.2)',
                borderRadius: '8px',
                fontSize: '13px',
                color: 'var(--orange)',
                fontWeight: '500',
              }}
            >
              <GitBranch size={15} />
              {pendingVOs} variation order{pendingVOs > 1 ? 's' : ''} awaiting approval
              <Link href={`/projects/${id}/variations`} style={{ marginLeft: 'auto', fontSize: '12.5px', color: 'var(--orange)', textDecoration: 'underline' }}>
                Review
              </Link>
            </div>
          )}

          {/* Phase progress */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--border)', fontSize: '14px', fontWeight: '600', color: 'var(--ink)' }}>
              Build Progress
            </div>
            <div>
              {project.phases.length === 0 ? (
                <div style={{ padding: '20px 18px', fontSize: '13px', color: 'var(--ink-light)' }}>No phases yet.</div>
              ) : (
                project.phases.map((phase) => {
                  const total = phase.tasks.length
                  const done = phase.tasks.filter((t) => t.status === 'COMPLETE').length
                  const pct = total > 0 ? Math.round((done / total) * 100) : 0
                  const isActive = phase.status === 'IN_PROGRESS'
                  const isDone = phase.status === 'COMPLETE'

                  return (
                    <div
                      key={phase.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 18px',
                        borderBottom: '1px solid var(--border-light)',
                        background: isActive ? '#fafdf9' : 'transparent',
                      }}
                    >
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: phase.color ?? '#ccc', flexShrink: 0 }} />
                      <div style={{ width: '160px', flexShrink: 0 }}>
                        <div style={{ fontSize: '13px', fontWeight: isActive ? '600' : '500', color: isDone ? 'var(--ink-light)' : 'var(--ink)' }}>
                          {phase.name}
                        </div>
                        {total > 0 && <div style={{ fontSize: '11px', color: 'var(--ink-light)' }}>{done}/{total} tasks</div>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ height: '5px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: isDone ? 'var(--green)' : (phase.color ?? '#ccc'), borderRadius: '3px' }} />
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--ink-mid)', width: '36px', textAlign: 'right' }}>{pct}%</div>
                      <div style={{ width: '80px', textAlign: 'right' }}>
                        {isDone ? (
                          <span style={{ fontSize: '11px', fontWeight: '600', background: 'var(--green-bg)', color: 'var(--green)', padding: '2px 7px', borderRadius: '10px' }}>Complete</span>
                        ) : isActive ? (
                          <span style={{ fontSize: '11px', fontWeight: '600', background: 'rgba(242,201,76,0.15)', color: 'var(--yellow-dark)', padding: '2px 7px', borderRadius: '10px' }}>Active</span>
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--ink-light)', padding: '2px 7px' }}>
                            {phase.startDate ? new Date(phase.startDate).toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }) : '—'}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Updates */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--ink)' }}>Activity</span>
              <Link href={`/projects/${id}/photos`} style={{ fontSize: '12.5px', color: 'var(--blue)', textDecoration: 'none' }}>View photos</Link>
            </div>
            <div>
              {project.updates.length === 0 ? (
                <div style={{ padding: '20px 18px', fontSize: '13px', color: 'var(--ink-light)' }}>No activity yet.</div>
              ) : (
                project.updates.map((u) => (
                  <div key={u.id} style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-light)', display: 'flex', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--navy)', color: 'var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>
                      {(u.authorName ?? 'U').slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)' }}>{u.authorName ?? 'Team'}</span>
                        <span style={{ fontSize: '11.5px', color: 'var(--ink-light)' }}>{new Date(u.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--ink-mid)', margin: 0, lineHeight: 1.5 }}>{u.content}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Milestones */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', fontSize: '13.5px', fontWeight: '600', color: 'var(--ink)' }}>Milestones</div>
            <div>
              {project.milestones.length === 0 ? (
                <div style={{ padding: '16px', fontSize: '12.5px', color: 'var(--ink-light)' }}>No milestones added.</div>
              ) : (
                project.milestones.map((m) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 16px', borderBottom: '1px solid var(--border-light)' }}>
                    {m.isComplete ? (
                      <CheckCircle2 size={16} color="var(--green)" style={{ flexShrink: 0, marginTop: '1px' }} />
                    ) : m.date && new Date(m.date) <= new Date() ? (
                      <Clock size={16} color="var(--orange)" style={{ flexShrink: 0, marginTop: '1px' }} />
                    ) : (
                      <Circle size={16} color="var(--border)" style={{ flexShrink: 0, marginTop: '1px' }} />
                    )}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '500', color: m.isComplete ? 'var(--ink-light)' : 'var(--ink)', textDecoration: m.isComplete ? 'line-through' : 'none' }}>{m.name}</div>
                      {m.date && <div style={{ fontSize: '11px', color: 'var(--ink-light)', marginTop: '2px' }}>{new Date(m.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</div>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Budget */}
          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13.5px', fontWeight: '600', color: 'var(--ink)' }}>
              Budget
              <Link href={`/projects/${id}/budget`} style={{ fontSize: '11.5px', color: 'var(--blue)', textDecoration: 'none', fontWeight: '400' }}>Details</Link>
            </div>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '9px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--ink-mid)' }}>Contract Value</span>
                <span style={{ fontWeight: '600' }}>Rp {formatIDR(project.contractValue)}</span>
              </div>
              {approvedVOTotal > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--purple)' }}>Approved VOs</span>
                  <span style={{ fontWeight: '600', color: 'var(--purple)' }}>+ Rp {formatIDR(approvedVOTotal)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: 'var(--ink-mid)' }}>Paid to Date</span>
                <span style={{ fontWeight: '600', color: 'var(--green)' }}>Rp {formatIDR(paidTotal)}</span>
              </div>
              <div style={{ height: '5px', background: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden', marginTop: '2px' }}>
                <div style={{ height: '100%', width: `${totalContract > 0 ? Math.min(100, Math.round(Number(paidTotal * BigInt(100)) / Number(totalContract))) : 0}%`, background: 'var(--green)', borderRadius: '3px' }} />
              </div>
            </div>
          </div>

          {/* Recent photos */}
          {project.photos.length > 0 && (
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13.5px', fontWeight: '600', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Camera size={14} /> Photos
                </span>
                <Link href={`/projects/${id}/photos`} style={{ fontSize: '11.5px', color: 'var(--blue)', textDecoration: 'none' }}>View all {project.photos.length}</Link>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px', padding: '2px' }}>
                {project.photos.slice(0, 6).map((photo) => (
                  <div key={photo.id} style={{ aspectRatio: '1', background: 'var(--border-light)', borderRadius: '4px', overflow: 'hidden' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.url} alt={photo.caption ?? ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
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
