import { describe, expect, it } from 'vitest'

import { datetime, id, resource, string } from '@define-js/core'

import { ValidationError, validateCreate, validateUpdate } from '../src/index.js'

const User = resource('User', {
  table: 'users',
  fields: {
    id: id(),
    email: string().email().unique(),
    name: string().min(2).max(50),
    createdAt: datetime().defaultNow(),
  },
})

describe('validateCreate', () => {
  it('accepts valid create payloads and normalizes datetime strings', () => {
    const payload = validateCreate(User, {
      email: 'user@example.com',
      name: 'Jane',
      createdAt: '2024-01-01T00:00:00.000Z',
    })

    expect(payload.email).toBe('user@example.com')
    expect(payload.name).toBe('Jane')
    expect(payload.createdAt).toBeInstanceOf(Date)
  })

  it('rejects invalid payloads with clear issues', () => {
    expect(() =>
      validateCreate(User, {
        email: 'invalid',
        name: 'A',
      }),
    ).toThrowError(ValidationError)

    try {
      validateCreate(User, {
        email: 'invalid',
        name: 'A',
      })
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      const typed = error as ValidationError
      expect(typed.issues).toContain('Field email must be a valid email')
      expect(typed.issues).toContain('Field name must have minimum length 2')
    }
  })
})

describe('validateUpdate', () => {
  it('rejects non-updatable fields', () => {
    expect(() =>
      validateUpdate(User, {
        id: 123,
      }),
    ).toThrowError(ValidationError)
  })

  it('accepts partial updates', () => {
    const patch = validateUpdate(User, {
      name: 'Updated',
    })

    expect(patch).toEqual({ name: 'Updated' })
  })
})
