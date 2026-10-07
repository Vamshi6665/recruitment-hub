import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { computeReport, listApplications, monthsBetween } from '@hub/shared'

const dir = new URL('../../client/public/data/', import.meta.url)
const ev = JSON.parse(readFileSync(new URL('events.json', dir), 'utf8'))
const ap = JSON.parse(readFileSync(new URL('applications.json', dir), 'utf8'))
const all = { from: '2024-01-01', to: '2026-10-05', recruiter: '', position: '', client: '' }

describe('shared metrics', () => {
  it('lists months across a year boundary', () => {
    expect(monthsBetween('2025-11-15', '2026-02-01')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02'])
  })

  it('returns the six stages in display order', () => {
    const r = computeReport(ev, all)
    expect(r.stages.map(s => s.stage)).toEqual(['Reached', 'Screened', 'Submitted', 'Interviewed', 'Offered', 'Hired'])
  })

  it('recruiter rows add up to the totals', () => {
    const r = computeReport(ev, all)
    for (const k of ['reached', 'submissions', 'interviewed', 'hires']) {
      expect(r.recruiters.reduce((s, x) => s + x[k], 0)).toBe(r.kpis[k])
    }
  })

  it('counts outreach attempts, not applications', () => {
    const r = computeReport(ev, all)
    expect(r.kpis.outreachAttempts).toBeGreaterThan(r.kpis.reached)
  })

  it('selects applications active in the range', () => {
    const f = { ...all, from: '2026-10-05', to: '2026-10-05' }
    const p = listApplications(ap, ev, f, '', 1, 100)
    expect(p.total).toBeGreaterThan(0)
    expect(p.rows.every(r => r.sourced <= '2026-10-05' && r.lastActivity >= '2026-10-05')).toBe(true)
  })
})
