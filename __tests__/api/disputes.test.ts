import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/generated/prisma', () => ({}))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    borrowCheckout: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    dispute: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    disputeResolution: {
      create: vi.fn(),
    },
    disputeEvent: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      createMany: vi.fn(),
    },
    conversation: {
      findFirst: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { POST as openDispute } from '@/app/api/disputes/route'
import { POST as resolveDispute } from '@/app/api/admin/disputes/[id]/resolve/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const mockAuth = vi.mocked(auth)
const mockCheckoutFindUnique = vi.mocked(prisma.borrowCheckout.findUnique)
const mockCheckoutUpdate = vi.mocked(prisma.borrowCheckout.update)
const mockDisputeCreate = vi.mocked(prisma.dispute.create)
const mockDisputeFindUnique = vi.mocked(prisma.dispute.findUnique)
const mockDisputeUpdate = vi.mocked(prisma.dispute.update)
const mockDisputeResolutionCreate = vi.mocked(prisma.disputeResolution.create)
const mockDisputeEventCreate = vi.mocked(prisma.disputeEvent.create)
const mockNotificationCreateMany = vi.mocked(prisma.notification.createMany)
const mockConversationFindFirst = vi.mocked(prisma.conversation.findFirst)
const mockTransaction = vi.mocked(prisma.$transaction)

function makeJsonRequest(body: object, url = 'http://localhost/api/disputes') {
  return { json: vi.fn().mockResolvedValue(body), url } as any
}

const RETURNED_CHECKOUT = {
  id: 'co1',
  status: 'returned',
  lenderId: 'lender1',
  borrowerId: 'borrower1',
  deposit: 100,
  returnedAt: new Date('2026-06-10'),
  aiDamageVerdict: null,
  aiDamageConfidence: null,
  aiDamageNotes: null,
  product: { name: 'Ladder' },
  borrower: { name: 'Bob', firstName: 'Bob', userName: 'bob' },
  dispute: null,
  conditionPhotos: [],
}

const OPEN_DISPUTE = {
  id: 'disp1',
  status: 'OPEN',
  borrowerId: 'borrower1',
  lenderId: 'lender1',
  checkoutId: 'co1',
  checkout: { product: { name: 'Ladder' } },
}

const VALID_DISPUTE_BODY = {
  checkoutId: 'co1',
  title: 'Item returned damaged',
  description: 'The ladder has a broken rung',
}

const VALID_RESOLVE_BODY = {
  decisionType: 'RELEASE_TO_LENDER',
  justification: 'The item was clearly damaged based on the before/after photos.',
  amountToLender: 100,
}

beforeEach(() => {
  vi.clearAllMocks()
  mockTransaction.mockImplementation((ops: any) =>
    Array.isArray(ops) ? Promise.all(ops) : ops(prisma)
  )
  mockDisputeCreate.mockResolvedValue({ id: 'disp1' } as any)
  mockDisputeEventCreate.mockResolvedValue({ id: 'de1' } as any)
  vi.mocked(prisma.notification.create).mockResolvedValue({ id: 'notif1' } as any)
  mockConversationFindFirst.mockResolvedValue(null)
  mockDisputeResolutionCreate.mockResolvedValue({ id: 'res1' } as any)
  mockDisputeUpdate.mockResolvedValue({ id: 'disp1', status: 'RESOLVED' } as any)
  mockCheckoutUpdate.mockResolvedValue({ id: 'co1' } as any)
  mockNotificationCreateMany.mockResolvedValue({ count: 2 } as any)
})

// ─── POST /api/disputes ───────────────────────────────────────────────────────

describe('POST /api/disputes (open dispute)', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await openDispute(makeJsonRequest(VALID_DISPUTE_BODY))
    expect(res.status).toBe(401)
  })

  it('returns 400 when required fields are missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    const res = await openDispute(makeJsonRequest({ checkoutId: 'co1' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when title is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    const res = await openDispute(
      makeJsonRequest({ checkoutId: 'co1', description: 'some description' })
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 when checkout is not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockCheckoutFindUnique.mockResolvedValue(null)
    const res = await openDispute(makeJsonRequest(VALID_DISPUTE_BODY))
    expect(res.status).toBe(404)
  })

  it('returns 403 when the session user is not the lender', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'someone-else' } } as any)
    mockCheckoutFindUnique.mockResolvedValue(RETURNED_CHECKOUT as any)
    const res = await openDispute(makeJsonRequest(VALID_DISPUTE_BODY))
    expect(res.status).toBe(403)
  })

  it('returns 409 when checkout status is not returned', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockCheckoutFindUnique.mockResolvedValue({ ...RETURNED_CHECKOUT, status: 'active' } as any)
    const res = await openDispute(makeJsonRequest(VALID_DISPUTE_BODY))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/returned/i)
  })

  it('returns 409 when a dispute already exists for this checkout', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockCheckoutFindUnique.mockResolvedValue({
      ...RETURNED_CHECKOUT,
      dispute: { id: 'existing-disp' },
    } as any)
    const res = await openDispute(makeJsonRequest(VALID_DISPUTE_BODY))
    expect(res.status).toBe(409)
    const body = await res.json()
    expect(body.error).toMatch(/already exists/i)
  })

  it('creates a dispute and returns 201 on valid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockCheckoutFindUnique.mockResolvedValue(RETURNED_CHECKOUT as any)

    const res = await openDispute(makeJsonRequest(VALID_DISPUTE_BODY))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.disputeId).toBe('disp1')
  })

  it('creates the dispute with correct lender/borrower ids', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockCheckoutFindUnique.mockResolvedValue(RETURNED_CHECKOUT as any)

    await openDispute(makeJsonRequest(VALID_DISPUTE_BODY))

    expect(mockDisputeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          checkoutId: 'co1',
          lenderId: 'lender1',
          borrowerId: 'borrower1',
          raisedById: 'lender1',
        }),
      })
    )
  })

  it('auto-derives photo URLs from stored condition photos', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockCheckoutFindUnique.mockResolvedValue({
      ...RETURNED_CHECKOUT,
      conditionPhotos: [
        { id: 'photo-before', role: 'before' },
        { id: 'photo-after', role: 'after' },
      ],
    } as any)

    await openDispute(makeJsonRequest(VALID_DISPUTE_BODY))

    expect(mockDisputeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          beforePhotoUrl: '/api/condition-photos/photo-before',
          afterPhotoUrl: '/api/condition-photos/photo-after',
        }),
      })
    )
  })

  it('uses client-supplied photo URLs over auto-derived ones', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockCheckoutFindUnique.mockResolvedValue({
      ...RETURNED_CHECKOUT,
      conditionPhotos: [{ id: 'photo-before', role: 'before' }],
    } as any)

    await openDispute(
      makeJsonRequest({
        ...VALID_DISPUTE_BODY,
        beforePhotoUrl: 'https://cdn.example.com/before.jpg',
      })
    )

    expect(mockDisputeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          beforePhotoUrl: 'https://cdn.example.com/before.jpg',
        }),
      })
    )
  })
})

// ─── POST /api/admin/disputes/[id]/resolve ────────────────────────────────────

describe('POST /api/admin/disputes/[id]/resolve', () => {
  it('returns 403 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await resolveDispute(makeJsonRequest(VALID_RESOLVE_BODY), {
      params: Promise.resolve({ id: 'disp1' }),
    })
    expect(res.status).toBe(403)
  })

  it('returns 403 when user is not an admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'user1', isAdmin: false } } as any)
    const res = await resolveDispute(makeJsonRequest(VALID_RESOLVE_BODY), {
      params: Promise.resolve({ id: 'disp1' }),
    })
    expect(res.status).toBe(403)
  })

  it('returns 400 when decisionType is missing', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', isAdmin: true } } as any)
    const res = await resolveDispute(
      makeJsonRequest({ justification: 'The damage is clearly visible in the photos submitted.' }),
      { params: Promise.resolve({ id: 'disp1' }) }
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when justification is shorter than 20 characters', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', isAdmin: true } } as any)
    const res = await resolveDispute(
      makeJsonRequest({ decisionType: 'RELEASE_TO_LENDER', justification: 'Too short.' }),
      { params: Promise.resolve({ id: 'disp1' }) }
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 when decisionType is not a valid value', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', isAdmin: true } } as any)
    const res = await resolveDispute(
      makeJsonRequest({
        decisionType: 'GIVE_MONEY_TO_NOBODY',
        justification: 'The damage is clearly visible in the photos submitted.',
      }),
      { params: Promise.resolve({ id: 'disp1' }) }
    )
    expect(res.status).toBe(400)
  })

  it('returns 404 when dispute is not found', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', isAdmin: true } } as any)
    mockDisputeFindUnique.mockResolvedValue(null)
    const res = await resolveDispute(makeJsonRequest(VALID_RESOLVE_BODY), {
      params: Promise.resolve({ id: 'disp1' }),
    })
    expect(res.status).toBe(404)
  })

  it('returns 409 when dispute is already RESOLVED', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', isAdmin: true } } as any)
    mockDisputeFindUnique.mockResolvedValue({ ...OPEN_DISPUTE, status: 'RESOLVED' } as any)
    const res = await resolveDispute(makeJsonRequest(VALID_RESOLVE_BODY), {
      params: Promise.resolve({ id: 'disp1' }),
    })
    expect(res.status).toBe(409)
  })

  it('returns 409 when dispute is already CLOSED', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', isAdmin: true } } as any)
    mockDisputeFindUnique.mockResolvedValue({ ...OPEN_DISPUTE, status: 'CLOSED' } as any)
    const res = await resolveDispute(makeJsonRequest(VALID_RESOLVE_BODY), {
      params: Promise.resolve({ id: 'disp1' }),
    })
    expect(res.status).toBe(409)
  })

  it('returns 200 with resolutionId on valid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', isAdmin: true } } as any)
    mockDisputeFindUnique.mockResolvedValue(OPEN_DISPUTE as any)

    const res = await resolveDispute(makeJsonRequest(VALID_RESOLVE_BODY), {
      params: Promise.resolve({ id: 'disp1' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.ok).toBe(true)
    expect(body.resolutionId).toBe('res1')
  })

  it('creates a DisputeResolution with the correct decision', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', isAdmin: true } } as any)
    mockDisputeFindUnique.mockResolvedValue(OPEN_DISPUTE as any)

    await resolveDispute(makeJsonRequest(VALID_RESOLVE_BODY), {
      params: Promise.resolve({ id: 'disp1' }),
    })

    expect(mockDisputeResolutionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          disputeId: 'disp1',
          resolvedById: 'admin1',
          decisionType: 'RELEASE_TO_LENDER',
          amountToLender: 100,
        }),
      })
    )
  })

  it('sends resolved notifications to both borrower and lender', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'admin1', isAdmin: true } } as any)
    mockDisputeFindUnique.mockResolvedValue(OPEN_DISPUTE as any)

    await resolveDispute(makeJsonRequest(VALID_RESOLVE_BODY), {
      params: Promise.resolve({ id: 'disp1' }),
    })

    expect(mockNotificationCreateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.arrayContaining([
          expect.objectContaining({ userId: 'borrower1', type: 'dispute_resolved' }),
          expect.objectContaining({ userId: 'lender1', type: 'dispute_resolved' }),
        ]),
      })
    )
  })

  it('accepts all three valid decision types', async () => {
    const decisionTypes = ['RELEASE_TO_LENDER', 'RETURN_TO_BORROWER', 'SPLIT']

    for (const decisionType of decisionTypes) {
      vi.clearAllMocks()
      mockTransaction.mockImplementation((ops: any) =>
        Array.isArray(ops) ? Promise.all(ops) : ops(prisma)
      )
      mockDisputeResolutionCreate.mockResolvedValue({ id: 'res1' } as any)
      mockDisputeUpdate.mockResolvedValue({ id: 'disp1' } as any)
      mockCheckoutUpdate.mockResolvedValue({ id: 'co1' } as any)
      mockDisputeEventCreate.mockResolvedValue({ id: 'de1' } as any)
      mockNotificationCreateMany.mockResolvedValue({ count: 2 } as any)

      mockAuth.mockResolvedValue({ user: { id: 'admin1', isAdmin: true } } as any)
      mockDisputeFindUnique.mockResolvedValue(OPEN_DISPUTE as any)

      const res = await resolveDispute(
        makeJsonRequest({ ...VALID_RESOLVE_BODY, decisionType }),
        { params: Promise.resolve({ id: 'disp1' }) }
      )
      expect(res.status).toBe(200)
    }
  })
})
