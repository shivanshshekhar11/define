import { describe, expect, it } from 'vitest'

import type { ResourceMeta } from '@define/core'

import { generateOpenApiDocument } from '../src/index.js'

describe('generateOpenApiDocument', () => {
  it('builds named component schemas and CRUD paths', () => {
    const resources: ResourceMeta[] = [
      {
        name: 'User',
        table: 'users',
        fields: {
          id: {
            kind: 'id',
            nullable: false,
            optional: true,
            unique: false,
            primary: true,
            defaultValue: undefined,
            autoIncrement: true,
            updatable: false,
            hidden: false,
            internal: false,
            validations: [],
          },
          email: {
            kind: 'string',
            nullable: false,
            optional: false,
            unique: true,
            primary: false,
            defaultValue: undefined,
            autoIncrement: false,
            updatable: true,
            hidden: false,
            internal: false,
            validations: [{ kind: 'email' }],
          },
          passwordHash: {
            kind: 'string',
            nullable: false,
            optional: false,
            unique: false,
            primary: false,
            defaultValue: undefined,
            autoIncrement: false,
            updatable: true,
            hidden: false,
            internal: true,
            validations: [],
          },
        },
        relations: [],
      },
    ]

    const output = generateOpenApiDocument({
      resources,
      info: {
        title: 'Test API',
        version: '1.0.0',
      },
    })

    expect(output.openapi).toBe('3.1.0')
    expect(output.info.title).toBe('Test API')

    expect(output.components.schemas.UserCreate).toBeDefined()
    expect(output.components.schemas.UserUpdate).toBeDefined()
    expect(output.components.schemas.UserResponse).toBeDefined()

    const responseSchema = output.components.schemas.UserResponse as {
      properties: Record<string, unknown>
    }

    expect(responseSchema.properties.passwordHash).toBeUndefined()
    expect(output.paths['/users']).toBeDefined()
    expect(output.paths['/users/{id}']).toBeDefined()
  })
})
