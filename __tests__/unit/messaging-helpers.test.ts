import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// security.ts imports @/auth and @/lib/prisma at the top level; mock them so
// next-auth and Prisma never attempt to connect during unit tests.
vi.mock('@/auth', () => ({ auth: vi.fn() }))
vi.mock('@/lib/prisma', () => ({ prisma: {} }))

import {
  validateMessageContent,
  validateRequiredId,
  checkMessageRateLimit,
  MESSAGE_MAX_LENGTH,
} from '@/lib/messaging/security'

// Clear the rate-limit bucket map between tests (module-level singleton stored on globalThis)
beforeEach(() => {
  ;(globalThis as any).messageRateBuckets?.clear()
})

// ─── validateMessageContent ───────────────────────────────────────────────────

describe('validateMessageContent', () => {
  it('rejects non-string values', () => {
    expect(validateMessageContent(123)).toEqual({ ok: false, error: 'Message content is required' })
    expect(validateMessageContent(null)).toEqual({ ok: false, error: 'Message content is required' })
    expect(validateMessageContent(undefined)).toEqual({ ok: false, error: 'Message content is required' })
  })

  it('rejects an empty string', () => {
    expect(validateMessageContent('')).toEqual({ ok: false, error: 'Message content is required' })
  })

  it('rejects a whitespace-only string', () => {
    expect(validateMessageContent('   ')).toEqual({ ok: false, error: 'Message content is required' })
  })

  it('rejects a string that exceeds the max length', () => {
    const longMsg = 'a'.repeat(MESSAGE_MAX_LENGTH + 1)
    const result = validateMessageContent(longMsg)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain(String(MESSAGE_MAX_LENGTH))
  })

  it('accepts a valid string and trims surrounding whitespace', () => {
    expect(validateMessageContent('  hello world  ')).toEqual({ ok: true, value: 'hello world' })
  })

  it('accepts a string exactly at the max length', () => {
    const msg = 'a'.repeat(MESSAGE_MAX_LENGTH)
    expect(validateMessageContent(msg)).toEqual({ ok: true, value: msg })
  })
})

// ─── validateRequiredId ───────────────────────────────────────────────────────

describe('validateRequiredId', () => {
  it('rejects non-string values', () => {
    expect(validateRequiredId(null, 'userId')).toEqual({ ok: false, error: 'userId is required' })
    expect(validateRequiredId(undefined, 'userId')).toEqual({ ok: false, error: 'userId is required' })
    expect(validateRequiredId(42, 'userId')).toEqual({ ok: false, error: 'userId is required' })
  })

  it('rejects an empty string', () => {
    expect(validateRequiredId('', 'itemId')).toEqual({ ok: false, error: 'itemId is required' })
  })

  it('rejects a whitespace-only string', () => {
    expect(validateRequiredId('   ', 'itemId')).toEqual({ ok: false, error: 'itemId is required' })
  })

  it('accepts a valid id and trims it', () => {
    expect(validateRequiredId('  abc123  ', 'userId')).toEqual({ ok: true, value: 'abc123' })
  })

  it('uses the provided field name in the error message', () => {
    expect(validateRequiredId('', 'checkoutId')).toEqual({ ok: false, error: 'checkoutId is required' })
  })
})

// ─── checkMessageRateLimit ────────────────────────────────────────────────────

describe('checkMessageRateLimit', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns null on the first message (allowed)', () => {
    expect(checkMessageRateLimit('user-a')).toBeNull()
  })

  it('allows exactly 8 messages within the time window', () => {
    for (let i = 0; i < 8; i++) {
      expect(checkMessageRateLimit('user-b')).toBeNull()
    }
  })

  it('returns a positive retry-after seconds when the limit is exceeded', () => {
    for (let i = 0; i < 8; i++) checkMessageRateLimit('user-c')
    const retryAfter = checkMessageRateLimit('user-c')
    expect(typeof retryAfter).toBe('number')
    expect(retryAfter).toBeGreaterThan(0)
  })

  it('resets the bucket after the 10-second window expires', () => {
    vi.useFakeTimers()

    for (let i = 0; i < 8; i++) checkMessageRateLimit('user-d')
    expect(checkMessageRateLimit('user-d')).not.toBeNull() // rate limited

    vi.advanceTimersByTime(11_000)

    expect(checkMessageRateLimit('user-d')).toBeNull() // reset
  })

  it('tracks limits independently per user', () => {
    for (let i = 0; i < 8; i++) checkMessageRateLimit('user-e')
    expect(checkMessageRateLimit('user-e')).not.toBeNull() // user-e is limited
    expect(checkMessageRateLimit('user-f')).toBeNull()    // user-f is not
  })
})
