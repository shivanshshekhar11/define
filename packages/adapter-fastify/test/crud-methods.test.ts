import { describe, expect, it } from 'vitest'

import { datetime, id, resource, string, type InferInsert, type InferUpdate } from '@define/core'

import { createCRUDMethods } from '../src/index.js'

const User = resource('User', {
  table: 'users',
  fields: {
    id: id(),
    email: string().email().unique(),
    name: string().min(2).max(50),
    createdAt: datetime().defaultNow(),
    passwordHash: string().internal().optional(),
  },
})

type UserInsert = InferInsert<typeof User>
type UserUpdate = InferUpdate<typeof User>

describe('createCRUDMethods', () => {
  it('returns reusable methods and schemas for manual routes', async () => {
    const rows: Array<{ id: number; email: string; name: string; createdAt: string; passwordHash?: string }> = []

    const { schemas, methods, primaryField } = createCRUDMethods({
      resource: User,
      repository: {
        insert: async (input: UserInsert) => {
          const next = {
            id: rows.length + 1,
            email: input.email,
            name: input.name,
            createdAt: (input.createdAt as Date | undefined)?.toISOString() ?? new Date().toISOString(),
            passwordHash: input.passwordHash,
          }
          rows.push(next)
          return next
        },
        findById: async (id) => rows.find((row) => row.id === id) ?? null,
        findMany: async () => rows,
        updateById: async (id, patch: UserUpdate) => {
          const row = rows.find((entry) => entry.id === id)
          if (!row) {
            return null
          }

          if (patch.name) {
            row.name = patch.name
          }

          return row
        },
      },
    })

    expect(primaryField).toBe('id')
    expect(schemas.createBodyJsonSchema).toBeDefined()

    const created = await methods.create({
      email: 'a@b.com',
      name: 'Alice',
    })

    expect(created.statusCode).toBe(201)
    expect((created.body as Record<string, unknown>).passwordHash).toBeUndefined()

    const list = await methods.findMany()
    expect(list.statusCode).toBe(200)
    expect(list.body).toHaveLength(1)

    const byId = await methods.findById({ id: '1' })
    expect(byId.statusCode).toBe(200)

    const updated = await methods.updateById({ id: '1' }, { name: 'Alice Updated' })
    expect(updated.statusCode).toBe(200)
  })
})
