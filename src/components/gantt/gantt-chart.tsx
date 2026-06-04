'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

export type GanttTask = {
  id: string
  name: string
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' | 'BLOCKED'
  startDate: string | null
  endDate: string | null
  progress: number
  assignee: string | null
}

export type GanttPhase = {
  id: string
  name: string
  color: string
  order: number
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE'
  startDate: string | null
  endDate: string | null
  tasks: GanttTask[]
}

interface GanttChartProps {
  phases: GanttPhase[]
  projectStart: string | null
  projectEnd: string | null
}

const LEFT_WIDTH = 300
const ROW_HEIGHT = 38
const HEADER_HEIGHT = 52
const MIN_DAY_WIDTH = 28

function addDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function startOfWeek(date: Date) {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function GanttChart({ phases, projectStart, projectEnd }: GanttChartProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  // Determine timeline range
  const { timelineStart, timelineEnd, totalDays } = useMemo(() => {
    const allDates: Date[] = []

    if (projectStart) allDates.push(new Date(projectStart))
    if (projectEnd) allDates.push(new Date(projectEnd))

    phases.forEach((phase) => {
      if (phase.startDate) allDates.push(new Date(phase.startDate))
      if (phase.endDate) allDates.push(new Date(phase.endDate))
      phase.tasks.forEach((task) => {
        if (task.startDate) allDates.push(new Date(task.startDate))
        if (task.endDate) allDates.push(new Date(task.endDate))
      })
    })

    let start: Date
    let end: Date

    if (allDates.length > 0) {
      const min = new Date(Math.min(...allDates.map((d) => d.getTime())))
      const max = new Date(Math.max(...allDates.map((d) => d.getTime())))
      start = addDays(min, -14)
      end = addDays(max, 14)
    } else {
      start = addDays(today, -60)
      end = addDays(today, 120)
    }

    // Snap to week start/end
    start = startOfWeek(start)
    end = addDays(startOfWeek(end), 7)

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    return { timelineStart: start, timelineEnd: end, totalDays }
  }, [phases, projectStart, projectEnd, today])

  // Build week/month headers
  const months = useMemo(() => {
    const result: { label: string; startPct: number; widthPct: number }[] = []
    let cursor = startOfMonth(timelineStart)

    while (cursor < timelineEnd) {
      const monthEnd = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)
      const start = Math.max(cursor.getTime(), timelineStart.getTime())
      const end = Math.min(monthEnd.getTime(), timelineEnd.getTime())
      const startPct = ((start - timelineStart.getTime()) / (totalDays * 86400000)) * 100
      const widthPct = ((end - start) / (totalDays * 86400000)) * 100
      result.push({
        label: cursor.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        startPct,
        widthPct,
      })
      cursor = monthEnd
    }
    return result
  }, [timelineStart, timelineEnd, totalDays])

  const weeks = useMemo(() => {
    const result: { label: string; startPct: number; widthPct: number; isToday: boolean }[] = []
    let cursor = new Date(timelineStart)

    while (cursor < timelineEnd) {
      const weekEnd = addDays(cursor, 7)
      const startPct = ((cursor.getTime() - timelineStart.getTime()) / (totalDays * 86400000)) * 100
      const widthPct = (7 / totalDays) * 100
      const isToday = today >= cursor && today < weekEnd
      result.push({
        label: cursor.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        startPct,
        widthPct,
        isToday,
      })
      cursor = weekEnd
    }
    return result
  }, [timelineStart, timelineEnd, totalDays, today])

  // Today position
  const todayPct = ((today.getTime() - timelineStart.getTime()) / (totalDays * 86400000)) * 100

  // Bar position helpers
  function barStyle(start: string | null, end: string | null, color: string, progress: number, isPhase = false) {
    if (!start || !end) return null
    const s = new Date(start)
    const e = new Date(end)
    const left = ((s.getTime() - timelineStart.getTime()) / (totalDays * 86400000)) * 100
    const width = ((e.getTime() - s.getTime()) / (totalDays * 86400000)) * 100
    if (width <= 0) return null

    return {
      left: `${Math.max(0, left)}%`,
      width: `${Math.min(100 - Math.max(0, left), width)}%`,
      height: isPhase ? '6px' : '20px',
      background: isPhase ? `${color}40` : color,
      borderRadius: '4px',
      position: 'absolute' as const,
      top: '50%',
      transform: 'translateY(-50%)',
      overflow: 'hidden',
    }
  }

  function progressStyle(progress: number, color: string) {
    return {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      width: `${progress}%`,
      background: `${color}cc`,
      borderRadius: '4px',
    }
  }

  const statusDot: Record<string, string> = {
    COMPLETE: 'var(--green)',
    IN_PROGRESS: 'var(--yellow-dark)',
    NOT_STARTED: 'var(--border)',
    BLOCKED: 'var(--red)',
  }

  const minWidth = totalDays * MIN_DAY_WIDTH

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', fontFamily: 'inherit' }}>
      {/* Left pane */}
      <div
        style={{
          width: LEFT_WIDTH,
          minWidth: LEFT_WIDTH,
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          background: 'var(--white)',
          overflowY: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            height: HEADER_HEIGHT,
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '0 16px 8px',
            background: 'var(--bg)',
          }}
        >
          <span style={{ fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--ink-light)' }}>
            Phase / Task
          </span>
        </div>

        {/* Rows */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {phases.map((phase) => {
            const isCollapsed = collapsed.has(phase.id)

            return (
              <div key={phase.id}>
                {/* Phase header */}
                <div
                  onClick={() =>
                    setCollapsed((prev) => {
                      const next = new Set(prev)
                      next.has(phase.id) ? next.delete(phase.id) : next.add(phase.id)
                      return next
                    })
                  }
                  style={{
                    height: ROW_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '0 16px',
                    background: 'var(--navy)',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                >
                  {isCollapsed ? (
                    <ChevronRight size={14} color="rgba(255,255,255,0.4)" />
                  ) : (
                    <ChevronDown size={14} color="rgba(255,255,255,0.4)" />
                  )}
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: phase.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '12.5px', fontWeight: '600', color: 'white', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {phase.name}
                  </span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                    {phase.tasks.length}
                  </span>
                </div>

                {/* Task rows */}
                {!isCollapsed &&
                  phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      style={{
                        height: ROW_HEIGHT,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0 16px 0 32px',
                        borderBottom: '1px solid var(--border-light)',
                        background: 'var(--white)',
                      }}
                    >
                      <div
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: statusDot[task.status] ?? 'var(--border)',
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: '12.5px',
                          color: task.status === 'COMPLETE' ? 'var(--ink-light)' : 'var(--ink)',
                          flex: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          textDecoration: task.status === 'COMPLETE' ? 'line-through' : 'none',
                        }}
                      >
                        {task.name}
                      </span>
                      {task.assignee && (
                        <div
                          style={{
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            background: 'var(--navy)',
                            color: 'var(--yellow)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '9px',
                            fontWeight: '700',
                            flexShrink: 0,
                          }}
                        >
                          {task.assignee.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )
          })}
        </div>
      </div>

      {/* Right pane — scrollable timeline */}
      <div style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        <div style={{ minWidth: minWidth, position: 'relative' }}>

          {/* Timeline header */}
          <div
            style={{
              height: HEADER_HEIGHT,
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg)',
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            {/* Month row */}
            <div style={{ height: '26px', position: 'relative', borderBottom: '1px solid var(--border-light)' }}>
              {months.map((m, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${m.startPct}%`,
                    width: `${m.widthPct}%`,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 8px',
                    borderRight: '1px solid var(--border-light)',
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--ink-mid)', whiteSpace: 'nowrap' }}>
                    {m.label}
                  </span>
                </div>
              ))}
            </div>
            {/* Week row */}
            <div style={{ height: '26px', position: 'relative' }}>
              {weeks.map((w, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: `${w.startPct}%`,
                    width: `${w.widthPct}%`,
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: w.isToday ? 'rgba(242,201,76,0.12)' : 'transparent',
                    borderRight: '1px solid var(--border-light)',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      color: w.isToday ? 'var(--yellow-dark)' : 'var(--ink-light)',
                      fontWeight: w.isToday ? '700' : '400',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {w.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Today line */}
          {todayPct >= 0 && todayPct <= 100 && (
            <div
              style={{
                position: 'absolute',
                left: `${todayPct}%`,
                top: HEADER_HEIGHT,
                bottom: 0,
                width: '2px',
                background: 'var(--yellow)',
                zIndex: 5,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-18px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'var(--yellow)',
                  color: 'var(--navy)',
                  fontSize: '9px',
                  fontWeight: '700',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  whiteSpace: 'nowrap',
                }}
              >
                TODAY
              </div>
            </div>
          )}

          {/* Row backgrounds + bars */}
          {phases.map((phase) => {
            const isCollapsed = collapsed.has(phase.id)
            const phasBar = barStyle(phase.startDate, phase.endDate, phase.color, 100, true)

            return (
              <div key={phase.id}>
                {/* Phase row */}
                <div
                  style={{
                    height: ROW_HEIGHT,
                    background: 'var(--navy)',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    position: 'relative',
                  }}
                >
                  {phasBar && (
                    <div style={phasBar} />
                  )}
                  {/* Vertical grid lines */}
                  {weeks.map((w, i) => (
                    <div
                      key={i}
                      style={{
                        position: 'absolute',
                        left: `${w.startPct}%`,
                        top: 0,
                        bottom: 0,
                        width: '1px',
                        background: 'rgba(255,255,255,0.04)',
                      }}
                    />
                  ))}
                </div>

                {/* Task rows */}
                {!isCollapsed &&
                  phase.tasks.map((task) => {
                    const tBar = barStyle(task.startDate, task.endDate, phase.color, task.progress)
                    return (
                      <div
                        key={task.id}
                        style={{
                          height: ROW_HEIGHT,
                          background: 'var(--white)',
                          borderBottom: '1px solid var(--border-light)',
                          position: 'relative',
                        }}
                      >
                        {/* Grid lines */}
                        {weeks.map((w, i) => (
                          <div
                            key={i}
                            style={{
                              position: 'absolute',
                              left: `${w.startPct}%`,
                              top: 0,
                              bottom: 0,
                              width: '1px',
                              background: w.isToday ? 'rgba(242,201,76,0.15)' : 'var(--border-light)',
                            }}
                          />
                        ))}
                        {/* Today column tint */}
                        {weeks
                          .filter((w) => w.isToday)
                          .map((w, i) => (
                            <div
                              key={i}
                              style={{
                                position: 'absolute',
                                left: `${w.startPct}%`,
                                width: `${w.widthPct}%`,
                                top: 0,
                                bottom: 0,
                                background: 'rgba(242,201,76,0.04)',
                              }}
                            />
                          ))}
                        {/* Bar */}
                        {tBar && (
                          <div style={tBar}>
                            <div style={progressStyle(task.progress, phase.color)} />
                          </div>
                        )}
                        {/* No-date placeholder */}
                        {!task.startDate && (
                          <div
                            style={{
                              position: 'absolute',
                              left: '8px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: '11px',
                              color: 'var(--ink-light)',
                              fontStyle: 'italic',
                            }}
                          >
                            No dates set
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
