import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    borrowRequest: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import { GET, POST } from '@/app/api/borrow-requests/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const mockAuth = vi.mocked(auth)
const mockCreate = vi.mocked(prisma.borrowRequest.create)
const mockFindMany = vi.mocked(prisma.borrowRequest.findMany)

function makeJsonRequest(body: object, url = 'http://localhost/api/borrow-requests') {
  return { json: vi.fn().mockResolvedValue(body), url } as any
}

function makeGetRequest(url: string) {
  return { url } as any
}

const VALID_BODY = {
  title: 'Need a ladder',
  neededFrom: '2026-07-01T00:00:00Z',
  neededUntil: '2026-07-05T00:00:00Z',
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ─── POST /api/borrow-requests ────────────────────────────────────────────────

describe('POST /api/borrow-requests', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await POST(makeJsonRequest(VALID_BODY))
    expect(res.status).toBe(401)
  })

  it('returns 400 when title is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as any)
    const res = await POST(makeJsonRequest({ neededFrom: '2026-07-01', neededUntil: '2026-07-05' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/title/i)
  })

  it('returns 400 when title is whitespace only', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as any)
    const res = await POST(makeJsonRequest({ ...VALID_BODY, title: '   ' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when neededFrom is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as any)
    const res = await POST(makeJsonRequest({ title: 'Need a ladder', neededUntil: '2026-07-05' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/neededFrom/i)
  })

  it('returns 400 when neededUntil is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as any)
    const res = await POST(makeJsonRequest({ title: 'Need a ladder', neededFrom: '2026-07-01' }))
    expect(res.status).toBe(400)
  })

  it('creates a request and returns 201 on valid payload', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as any)
    const created = { id: 'req1', title: 'Need a ladder', status: 'open', requesterId: 'user1' }
    mockCreate.mockResolvedValue(created as any)

    const res = await POST(makeJsonRequest(VALID_BODY))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe('req1')
  })

  it('sets isPrivate to false and targetUserId to null when not provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as any)
    mockCreate.mockResolvedValue({ id: 'req1' } as any)

    await POST(makeJsonRequest(VALID_BODY))

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPrivate: false, targetUserId: null }),
      })
    )
  })

  it('sets targetUserId when isPrivate is true and targetUserId is provided', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as any)
    mockCreate.mockResolvedValue({ id: 'req1' } as any)

    await POST(makeJsonRequest({ ...VALID_BODY, isPrivate: true, targetUserId: 'user2' }))

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ isPrivate: true, targetUserId: 'user2' }),
      })
    )
  })

  it('ignores targetUserId when isPrivate is false', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as any)
    mockCreate.mockResolvedValue({ id: 'req1' } as any)

    await POST(makeJsonRequest({ ...VALID_BODY, isPrivate: false, targetUserId: 'user2' }))

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ targetUserId: null }),
      })
    )
  })

  it('trims whitespace from title before saving', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as any)
    mockCreate.mockResolvedValue({ id: 'req1' } as any)

    await POST(makeJsonRequest({ ...VALID_BODY, title: '  Need a ladder  ' }))

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ title: 'Need a ladder' }),
      })
    )
  })
})

// ─── GET /api/borrow-requests ─────────────────────────────────────────────────

describe('GET /api/borrow-requests', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(makeGetRequest('http://localhost/api/borrow-requests'))
    expect(res.status).toBe(401)
  })

  it('filters by requesterId when ?mine=true', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as any)
    mockFindMany.mockResolvedValue([])

    await GET(makeGetRequest('http://localhost/api/borrow-requests?mine=true'))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { requesterId: 'user1' } })
    )
  })

  it('filters public open requests when ?mine is not set', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as any)
    mockFindMany.mockResolvedValue([])

    await GET(makeGetRequest('http://localhost/api/borrow-requests'))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'open', isPrivate: false }),
      })
    )
  })

  it('excludes the current user from public results', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as any)
    mockFindMany.mockResolvedValue([])

    await GET(makeGetRequest('http://localhost/api/borrow-requests'))

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ NOT: { requesterId: 'user1' } }),
      })
    )
  })

  it('returns the list of requests with status 200', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1' } } as any)
    mockFindMany.mockResolvedValue([{ id: 'req1' }, { id: 'req2' }] as any)

    const res = await GET(makeGetRequest('http://localhost/api/borrow-requests'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(2)
    expect(body[0].id).toBe('req1')
  })
})
