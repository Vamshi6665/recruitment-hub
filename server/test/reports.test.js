import { describe, it, expect } from 'vitest'
import { createReports } from '../src/services/reports.js'

const fakeAthena = (ok) => () => ({
  name: 'athena',
  probe: async () => { if (!ok) throw new Error('AccessDenied'); return {} },
  meta: async () => ({ minDate: '2024-01-01', maxDate: '2026-10-05', recruiters: [], positions: [], clients: [] }),
  report: async f => ({ filters: f, from: 'athena' }),
})

describe('data source selection', () => {
  it('uses Athena when the probe succeeds', async () => {
    const r = createReports({ mode: 'auto', athenaFactory: fakeAthena(true) })
    expect((await r.status()).source).toBe('athena')
    expect((await r.report({})).from).toBe('athena')
  })

  it('falls back to exported JSON in auto mode and records why', async () => {
    const r = createReports({ mode: 'auto', athenaFactory: fakeAthena(false) })
    const s = await r.status()
    expect(s.source).toBe('json')
    expect(s.fallbackReason).toBe('AccessDenied')
    expect((await r.report({})).kpis.hires).toBe(1892)
  })

  it('fails with 503 in athena-only mode', async () => {
    const r = createReports({ mode: 'athena', athenaFactory: fakeAthena(false) })
    await expect(r.meta()).rejects.toMatchObject({ status: 503 })
  })
})
