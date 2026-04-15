import { describe, expect, it } from 'vitest'

import {
  datetime,
  id,
  resource,
  string,
  type InferInsert,
  type InferUpdate,
} from '@define-js/core'
import Fastify from 'fastify'

import { registerCRUDRoutes } from '../src/index.js'

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

describe('registerCRUDRoutes', () => {
  it('registers CRUD endpoints with validation', async () => {
    const fastify = Fastify()

    const rows: Array<{ id: number; email: string; name: string; createdAt: string; passwordHash?: string }> = []

    await registerCRUDRoutes({
      fastify,
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

          if (patch.email) {
            row.email = patch.email
          }

          if (patch.name) {
            row.name = patch.name
          }

          return row
        },
      },
    })

    const createRes = await fastify.inject({
      method: 'POST',
      url: '/users',
      payload: {
        email: 'a@b.com',
        name: 'Alice',
      },
    })

    expect(createRes.statusCode).toBe(201)
    expect(createRes.json().passwordHash).toBeUndefined()

    const listRes = await fastify.inject({
      method: 'GET',
      url: '/users',
    })

    expect(listRes.statusCode).toBe(200)
    expect(listRes.json()).toHaveLength(1)
    expect(listRes.json()[0].passwordHash).toBeUndefined()

    const patchRes = await fastify.inject({
      method: 'PATCH',
      url: '/users/1',
      payload: {
        name: 'Alice Updated',
      },
    })

    expect(patchRes.statusCode).toBe(200)
    expect(patchRes.json().passwordHash).toBeUndefined()

    const badRes = await fastify.inject({
      method: 'POST',
      url: '/users',
      payload: {
        email: 'bad-email',
        name: 'A',
      },
    })

    expect(badRes.statusCode).toBe(400)

    await fastify.close()
  })
})
