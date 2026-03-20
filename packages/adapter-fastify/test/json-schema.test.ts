import { describe, expect, it } from 'vitest'

import { boolean, datetime, id, int, resource, string } from '@define/core'

import { generateResourceJsonSchemas } from '../src/index.js'

const User = resource('User', {
  table: 'users',
  fields: {
    id: id(),
    email: string().email().unique(),
    name: string().min(2).max(50),
    age: int().nullable().optional(),
    active: boolean().default(true),
    createdAt: datetime().defaultNow(),
    passwordHash: string().internal(),
    apiToken: string().hidden(),
  },
})

describe('generateResourceJsonSchemas', () => {
  it('creates create/update/response/id schemas', () => {
    const schemas = generateResourceJsonSchemas(User)

    expect(schemas.createBodyJsonSchema).toMatchObject({
      type: 'object',
      additionalProperties: false,
      required: ['email', 'name'],
    })

    expect(schemas.updateBodyJsonSchema).toMatchObject({
      type: 'object',
      additionalProperties: false,
    })

    expect(schemas.responseJsonSchema).toMatchObject({
      type: 'object',
      additionalProperties: false,
    })

    const response = schemas.responseJsonSchema as {
      properties: Record<string, unknown>
      required: string[]
    }

    expect(response.properties.passwordHash).toBeUndefined()
    expect(response.properties.apiToken).toBeUndefined()
    expect(response.required).not.toContain('passwordHash')
    expect(response.required).not.toContain('apiToken')

    expect(schemas.idParamJsonSchema).toEqual({
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { type: 'integer' },
      },
    })
  })
})
