import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { GanttChart } from '@/components/gantt/gantt-chart'
import type { GanttPhase } from '@/components/gantt/gantt-chart'

interface Props {
  params: Promise<{ id: string }>
}

export default async function SchedulePage({ params }: Props) {
  const { id } = await params
  const session = await auth()

  const project = await prisma.project.findFirst({
    where: { id, ownerId: session!.user!.id },
    select: {
      startDate: true,
      targetEndDate: true,
      phases: {
        orderBy: { order: 'asc' },
        include: {
          tasks: { orderBy: { startDate: 'asc' } },
        },
      },
    },
  })

  if (!project) notFound()

  // Serialize for client — convert Dates to ISO strings, no BigInt
  const phases: GanttPhase[] = project.phases.map((phase) => ({
    id: phase.id,
    name: phase.name,
    color: phase.color ?? '#718096',
    order: phase.order,
    status: phase.status as GanttPhase['status'],
    startDate: phase.startDate?.toISOString() ?? null,
    endDate: phase.endDate?.toISOString() ?? null,
    tasks: phase.tasks.map((task) => ({
      id: task.id,
      name: task.name,
      status: task.status as GanttPhase['tasks'][number]['status'],
      startDate: task.startDate?.toISOString() ?? null,
      endDate: task.endDate?.toISOString() ?? null,
      progress: task.progress,
      assignee: task.assignee,
    })),
  }))

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      <GanttChart
        phases={phases}
        projectStart={project.startDate?.toISOString() ?? null}
        projectEnd={project.targetEndDate?.toISOString() ?? null}
      />
    </div>
  )
}
