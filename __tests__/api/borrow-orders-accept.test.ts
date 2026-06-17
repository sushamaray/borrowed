import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({
  prisma: {
    borrowCheckout: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    conditionPhoto: {
      create: vi.fn(),
    },
    lentItem: {
      update: vi.fn(),
    },
    notification: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}))

import { PATCH } from '@/app/api/borrow-orders/[id]/accept/route'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

const mockAuth = vi.mocked(auth)
const mockFindUnique = vi.mocked(prisma.borrowCheckout.findUnique)
const mockCheckoutUpdate = vi.mocked(prisma.borrowCheckout.update)
const mockConditionPhotoCreate = vi.mocked(prisma.conditionPhoto.create)
const mockLentItemUpdate = vi.mocked(prisma.lentItem.update)
const mockNotificationCreate = vi.mocked(prisma.notification.create)
const mockTransaction = vi.mocked(prisma.$transaction)

const validFile = {
  type: 'image/jpeg',
  size: 1024,
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(4)),
}

function makeFormRequest(file: unknown) {
  const fd = { get: vi.fn().mockReturnValue(file) }
  return {
    formData: vi.fn().mockResolvedValue(fd),
    url: 'http://localhost/api/borrow-orders/co1/accept',
  } as any
}

const CHECKOUT = {
  id: 'co1',
  status: 'pending',
  lenderId: 'lender1',
  borrowerId: 'borrower1',
  lentItemId: 'item1',
  product: { name: 'Ladder' },
  lender: { name: 'Alice', firstName: 'Alice', lastName: null, userName: 'alice' },
  lentItem: { id: 'item1' },
}

beforeEach(() => {
  vi.clearAllMocks()
  // Execute ops array directly so individual method mocks still record calls
  mockTransaction.mockImplementation((ops: any) =>
    Array.isArray(ops) ? Promise.all(ops) : ops(prisma)
  )
  mockCheckoutUpdate.mockResolvedValue({ id: 'co1', status: 'accepted' } as any)
  mockConditionPhotoCreate.mockResolvedValue({ id: 'cp1' } as any)
  mockLentItemUpdate.mockResolvedValue({ id: 'item1' } as any)
  mockNotificationCreate.mockResolvedValue({ id: 'notif1' } as any)
})

// ─── PATCH /api/borrow-orders/[id]/accept ────────────────────────────────────

describe('PATCH /api/borrow-orders/[id]/accept', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await PATCH(makeFormRequest(validFile), { params: Promise.resolve({ id: 'co1' }) })
    expect(res.status).toBe(401)
  })

  it('returns 400 when beforePhoto is absent from form data', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    const res = await PATCH(makeFormRequest(null), { params: Promise.resolve({ id: 'co1' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/beforePhoto/i)
  })

  it('returns 400 when the file type is not an image', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    const pdfFile = { ...validFile, type: 'application/pdf' }
    const res = await PATCH(makeFormRequest(pdfFile), { params: Promise.resolve({ id: 'co1' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/image/i)
  })

  it('returns 400 when the file exceeds 10 MB', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    const largeFile = { ...validFile, size: 11 * 1024 * 1024 }
    const res = await PATCH(makeFormRequest(largeFile), { params: Promise.resolve({ id: 'co1' }) })
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toMatch(/large/i)
  })

  it('returns 404 when the checkout does not exist', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockFindUnique.mockResolvedValue(null)
    const res = await PATCH(makeFormRequest(validFile), { params: Promise.resolve({ id: 'co1' }) })
    expect(res.status).toBe(404)
  })

  it('returns 403 when the session user is not the lender', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'someone-else' } } as any)
    mockFindUnique.mockResolvedValue(CHECKOUT as any)
    const res = await PATCH(makeFormRequest(validFile), { params: Promise.resolve({ id: 'co1' }) })
    expect(res.status).toBe(403)
  })

  it('returns 409 when the checkout status is not pending', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockFindUnique.mockResolvedValue({ ...CHECKOUT, status: 'accepted' } as any)
    const res = await PATCH(makeFormRequest(validFile), { params: Promise.resolve({ id: 'co1' }) })
    expect(res.status).toBe(409)
  })

  it('returns 200 and executes the transaction on valid input', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockFindUnique.mockResolvedValue(CHECKOUT as any)

    const res = await PATCH(makeFormRequest(validFile), { params: Promise.resolve({ id: 'co1' }) })
    expect(res.status).toBe(200)
    expect((await res.json()).ok).toBe(true)
    expect(mockTransaction).toHaveBeenCalledOnce()
  })

  it('updates checkout status to accepted', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockFindUnique.mockResolvedValue(CHECKOUT as any)

    await PATCH(makeFormRequest(validFile), { params: Promise.resolve({ id: 'co1' }) })

    expect(mockCheckoutUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'co1' }, data: { status: 'accepted' } })
    )
  })

  it('creates a before conditionPhoto record', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockFindUnique.mockResolvedValue(CHECKOUT as any)

    await PATCH(makeFormRequest(validFile), { params: Promise.resolve({ id: 'co1' }) })

    expect(mockConditionPhotoCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ checkoutId: 'co1', role: 'before' }),
      })
    )
  })

  it('marks the lent item as borrowed', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockFindUnique.mockResolvedValue(CHECKOUT as any)

    await PATCH(makeFormRequest(validFile), { params: Promise.resolve({ id: 'co1' }) })

    expect(mockLentItemUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'item1' }, data: { status: 'borrowed' } })
    )
  })

  it('skips lent item update when lentItemId is null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockFindUnique.mockResolvedValue({ ...CHECKOUT, lentItemId: null, lentItem: null } as any)

    const res = await PATCH(makeFormRequest(validFile), { params: Promise.resolve({ id: 'co1' }) })
    expect(res.status).toBe(200)
    expect(mockLentItemUpdate).not.toHaveBeenCalled()
  })

  it('sends an accepted notification to the borrower', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'lender1' } } as any)
    mockFindUnique.mockResolvedValue(CHECKOUT as any)

    await PATCH(makeFormRequest(validFile), { params: Promise.resolve({ id: 'co1' }) })

    expect(mockNotificationCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'borrower1',
          type: 'borrow_accepted',
        }),
      })
    )
  })
})
