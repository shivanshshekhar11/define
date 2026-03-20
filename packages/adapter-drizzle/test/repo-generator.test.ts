import { describe, expect, it } from 'vitest'

import type { ResourceMeta } from '@define/core'

import { generateRepositoryArtifacts } from '../src/index.js'

describe('generateRepositoryArtifacts', () => {
  it('creates types, repo, and index files per resource', () => {
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
            validations: [],
          },
          createdAt: {
            kind: 'datetime',
            nullable: false,
            optional: true,
            unique: false,
            primary: false,
            defaultValue: 'now',
            autoIncrement: false,
            updatable: true,
            hidden: false,
            internal: false,
            validations: [],
          },
        },
        relations: [],
      },
    ]

    const { files } = generateRepositoryArtifacts({ resources })

    const paths = files.map((file) => file.path)

    expect(paths).toEqual(['user.types.ts', 'user.repo.ts', 'index.ts'])

    const typeFile = files.find((file) => file.path === 'user.types.ts')
    const repoFile = files.find((file) => file.path === 'user.repo.ts')

    expect(typeFile?.code).toContain('export interface UserInsert {')
    expect(typeFile?.code).toContain('id?: number')
    expect(typeFile?.code).toContain('email: string')
    expect(typeFile?.code).toContain('createdAt?: Date')

    expect(repoFile?.code).toContain('export const UserRepo = {')
    expect(repoFile?.code).toContain('findById: async (userId: UserRow[\'id\'])')
    expect(repoFile?.code).toContain('updateById: async (userId: UserRow[\'id\'], patch: UserUpdate)')
  })
})
