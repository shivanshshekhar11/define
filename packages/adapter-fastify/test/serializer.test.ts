import { describe, expect, it } from 'vitest'

import { datetime, id, resource, string } from '@define-js/core'

import { createResourceSerializer } from '../src/index.js'

const User = resource('User', {
  table: 'users',
  fields: {
    id: id(),
    email: string(),
    createdAt: datetime(),
    passwordHash: string().internal(),
    apiToken: string().hidden(),
  },
})

describe('createResourceSerializer', () => {
  it('filters hidden/internal fields and normalizes Date values', () => {
    const serialize = createResourceSerializer(User)

    const output = serialize({
      id: 1,
      email: 'jane@example.com',
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      passwordHash: 'secret',
      apiToken: 'token',
    })

    expect(output).toEqual({
      id: 1,
      email: 'jane@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
    })
  })
})
