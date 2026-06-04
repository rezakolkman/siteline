'use client'

import { useState } from 'react'

interface NewProjectFormProps {
  createProject: (formData: FormData) => Promise<void>
}

export function NewProjectForm({ createProject }: NewProjectFormProps) {
  const [projectType, setProjectType] = useState<'NEW_BUILD' | 'RENOVATION'>('NEW_BUILD')
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    const formData = new FormData(e.currentTarget)
    await createProject(formData)
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Project type */}
      <div>
        <label style={labelStyle}>Project Type</label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          {(['NEW_BUILD', 'RENOVATION'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setProjectType(type)}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                border: `2px solid ${projectType === type ? 'var(--navy)' : 'var(--border)'}`,
                background: projectType === type ? 'var(--navy)' : 'var(--white)',
                color: projectType === type ? 'white' : 'var(--ink-mid)',
                fontSize: '13.5px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {type === 'NEW_BUILD' ? 'New Build' : 'Renovation'}
            </button>
          ))}
          <input type="hidden" name="type" value={projectType} />
        </div>
        <p style={{ fontSize: '12px', color: 'var(--ink-light)', marginTop: '6px' }}>
          {projectType === 'RENOVATION'
            ? 'Renovation template — sets default phases and 12.5% contingency'
            : 'New build template — sets 7 construction phases and 5% contingency'}
        </p>
      </div>

      {/* Project name */}
      <div>
        <label htmlFor="name" style={labelStyle}>
          Project Name <span style={{ color: 'var(--red)' }}>*</span>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          placeholder="e.g. Villa Bukit Sari"
          style={inputStyle}
        />
      </div>

      {/* Location + Bedrooms */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '14px' }}>
        <div>
          <label htmlFor="location" style={labelStyle}>Location</label>
          <input
            id="location"
            name="location"
            type="text"
            placeholder="e.g. Bukit, Bali"
            style={inputStyle}
          />
        </div>
        <div>
          <label htmlFor="bedrooms" style={labelStyle}>Bedrooms</label>
          <input
            id="bedrooms"
            name="bedrooms"
            type="number"
            min="1"
            max="20"
            placeholder="4"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Contract value + Contingency */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: '14px' }}>
        <div>
          <label htmlFor="contractValue" style={labelStyle}>Contract Value (IDR)</label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '13px',
                color: 'var(--ink-light)',
                userSelect: 'none',
              }}
            >
              Rp
            </span>
            <input
              id="contractValue"
              name="contractValue"
              type="text"
              inputMode="numeric"
              placeholder="4,200,000,000"
              style={{ ...inputStyle, paddingLeft: '34px' }}
            />
          </div>
        </div>
        <div>
          <label htmlFor="contingencyPct" style={labelStyle}>Contingency %</label>
          <input
            id="contingencyPct"
            name="contingencyPct"
            type="number"
            step="0.5"
            min="0"
            max="25"
            defaultValue={projectType === 'RENOVATION' ? 12.5 : 5}
            key={projectType}
            style={inputStyle}
          />
        </div>
      </div>

      {/* Dates */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div>
          <label htmlFor="startDate" style={labelStyle}>Start Date</label>
          <input id="startDate" name="startDate" type="date" style={inputStyle} />
        </div>
        <div>
          <label htmlFor="targetEndDate" style={labelStyle}>Target Completion</label>
          <input id="targetEndDate" name="targetEndDate" type="date" style={inputStyle} />
        </div>
      </div>

      {/* Client */}
      <div
        style={{
          borderTop: '1px solid var(--border-light)',
          paddingTop: '20px',
        }}
      >
        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ink)', marginBottom: '14px' }}>
          Client (optional)
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <label htmlFor="clientName" style={labelStyle}>Client Name</label>
            <input
              id="clientName"
              name="clientName"
              type="text"
              placeholder="e.g. Hendra Gunawan"
              style={inputStyle}
            />
          </div>
          <div>
            <label htmlFor="clientEmail" style={labelStyle}>Client Email</label>
            <input
              id="clientEmail"
              name="clientEmail"
              type="email"
              placeholder="hendra@email.com"
              style={inputStyle}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: '10px',
          paddingTop: '8px',
          borderTop: '1px solid var(--border-light)',
        }}
      >
        <a
          href="/projects"
          style={{
            padding: '8px 18px',
            borderRadius: '7px',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--ink-mid)',
            fontSize: '13.5px',
            fontWeight: '500',
            textDecoration: 'none',
          }}
        >
          Cancel
        </a>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: '8px 20px',
            borderRadius: '7px',
            border: 'none',
            background: pending ? 'var(--border)' : 'var(--yellow)',
            color: 'var(--navy)',
            fontSize: '13.5px',
            fontWeight: '600',
            cursor: pending ? 'not-allowed' : 'pointer',
          }}
        >
          {pending ? 'Creating…' : 'Create Project'}
        </button>
      </div>
    </form>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12.5px',
  fontWeight: '500',
  color: 'var(--ink-mid)',
  marginBottom: '5px',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: '7px',
  border: '1px solid var(--border)',
  background: 'var(--white)',
  fontSize: '13.5px',
  color: 'var(--ink)',
  outline: 'none',
  fontFamily: 'inherit',
}
