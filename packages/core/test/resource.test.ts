import { describe, expect, it } from 'vitest'

import {
  boolean,
  datetime,
  getResourceMeta,
  id,
  int,
  resource,
  string,
} from '../src/index.js'

describe('resource DSL', () => {
  it('builds runtime resource metadata', () => {
    const User = resource('User', {
      table: 'users',
      fields: {
        id: id(),
        email: string().email().unique(),
        age: int().min(18).nullable(),
        createdAt: datetime().defaultNow(),
        active: boolean().default(true),
        passwordHash: string().internal(),
        apiToken: string().hidden(),
      },
    })

    const meta = getResourceMeta(User)

    expect(meta.name).toBe('User')
    expect(meta.table).toBe('users')

    expect(meta.fields.id.primary).toBe(true)
    expect(meta.fields.id.autoIncrement).toBe(true)
    expect(meta.fields.id.optional).toBe(true)
    expect(meta.fields.id.updatable).toBe(false)

    expect(meta.fields.email.kind).toBe('string')
    expect(meta.fields.email.unique).toBe(true)
    expect(meta.fields.email.validations).toEqual([{ kind: 'email' }])

    expect(meta.fields.age.nullable).toBe(true)
    expect(meta.fields.age.validations).toEqual([{ kind: 'min', value: 18 }])

    expect(meta.fields.createdAt.defaultValue).toBe('now')
    expect(meta.fields.createdAt.optional).toBe(true)

    expect(meta.fields.active.defaultValue).toBe(true)
    expect(meta.fields.passwordHash.internal).toBe(true)
    expect(meta.fields.passwordHash.hidden).toBe(false)
    expect(meta.fields.apiToken.hidden).toBe(true)
    expect(meta.fields.apiToken.internal).toBe(false)
  })

  it('keeps string-specific methods available after common chaining', () => {
    const field = string().unique().email().min(2).max(50)
    const meta = field.getMeta()

    expect(meta.unique).toBe(true)
    expect(meta.validations).toEqual([
      { kind: 'email' },
      { kind: 'min', value: 2 },
      { kind: 'max', value: 50 },
    ])
  })
})
