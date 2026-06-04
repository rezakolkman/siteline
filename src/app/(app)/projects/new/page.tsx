'use server'

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppNavbar } from '@/components/layout/app-navbar'
import { NewProjectForm } from './form'
import { nanoid } from 'nanoid'

export default async function NewProjectPage() {
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
        <span className="text-[13px] font-medium text-ink">New Project</span>
      </AppNavbar>

      <div className="min-h-0 flex-1 overflow-auto bg-app-bg px-6 py-8">
      <div className="max-w-[680px]">
        <h1
          style={{
            fontSize: '22px',
            fontWeight: '700',
            color: 'var(--ink)',
            marginBottom: '4px',
          }}
        >
          New Project
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--ink-light)', marginBottom: '28px' }}>
          Fill in the details below. You can add phases, tasks, and BOQ items after creating the project.
        </p>

        <NewProjectForm createProject={createProject} />
      </div>
      </div>
    </div>
  )
}

async function createProject(formData: FormData) {
  'use server'

  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const name = formData.get('name') as string
  const type = formData.get('type') as 'NEW_BUILD' | 'RENOVATION'
  const location = formData.get('location') as string
  const bedrooms = formData.get('bedrooms') ? Number(formData.get('bedrooms')) : null
  const contractValueRaw = formData.get('contractValue') as string
  const contractValue = contractValueRaw
    ? BigInt(contractValueRaw.replace(/[^0-9]/g, ''))
    : BigInt(0)
  const contingencyPct = formData.get('contingencyPct')
    ? Number(formData.get('contingencyPct'))
    : type === 'RENOVATION' ? 12.5 : 5.0
  const startDate = formData.get('startDate')
    ? new Date(formData.get('startDate') as string)
    : null
  const targetEndDate = formData.get('targetEndDate')
    ? new Date(formData.get('targetEndDate') as string)
    : null
  const clientName = formData.get('clientName') as string
  const clientEmail = formData.get('clientEmail') as string

  if (!name?.trim()) return

  // Create client record if name provided
  let clientId: string | undefined
  if (clientName?.trim()) {
    const client = await prisma.client.create({
      data: {
        name: clientName.trim(),
        email: clientEmail?.trim() || null,
      },
    })
    clientId = client.id
  }

  // Default phase templates
  const newBuildPhases = [
    { name: 'Foundation', color: '#e67e22', order: 0 },
    { name: 'Structure', color: '#3498db', order: 1 },
    { name: 'Roofing', color: '#9b59b6', order: 2 },
    { name: 'MEP', color: '#1abc9c', order: 3 },
    { name: 'Interior Finishing', color: '#f39c12', order: 4 },
    { name: 'Exterior & Landscaping', color: '#27ae60', order: 5 },
    { name: 'Handover', color: '#1a2332', order: 6 },
  ]

  const renovationPhases = [
    { name: 'Demo & Strip-out', color: '#e74c3c', order: 0 },
    { name: 'Structural Changes', color: '#3498db', order: 1 },
    { name: 'MEP Upgrade', color: '#1abc9c', order: 2 },
    { name: 'Tiling & Plastering', color: '#9b59b6', order: 3 },
    { name: 'Joinery & Carpentry', color: '#f39c12', order: 4 },
    { name: 'Paint & Finishing', color: '#27ae60', order: 5 },
  ]

  const phases = type === 'RENOVATION' ? renovationPhases : newBuildPhases

  const project = await prisma.project.create({
    data: {
      name: name.trim(),
      type,
      location: location?.trim() || null,
      bedrooms,
      contractValue,
      contingencyPct,
      startDate,
      targetEndDate,
      clientId: clientId ?? null,
      ownerId: session.user.id,
      clientPortalToken: nanoid(24),
      phases: {
        create: phases,
      },
    },
  })

  redirect(`/projects/${project.id}`)
}
