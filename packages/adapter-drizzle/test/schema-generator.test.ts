import { describe, expect, it } from 'vitest'

import type { ResourceMeta } from '@define/core'

import { generateDrizzleSchema } from '../src/index.js'

describe('generateDrizzleSchema', () => {
  it('maps resource fields to drizzle pg-core columns', () => {
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
          age: {
            kind: 'int',
            nullable: true,
            optional: true,
            unique: false,
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
          active: {
            kind: 'boolean',
            nullable: false,
            optional: true,
            unique: false,
            primary: false,
            defaultValue: true,
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

    const { code } = generateDrizzleSchema({ resources })

    expect(code).toContain("import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'")
    expect(code).toContain('export const users = pgTable("users", {')
    expect(code).toContain('id: serial("id").notNull().primaryKey(),')
    expect(code).toContain('email: text("email").notNull().unique(),')
    expect(code).toContain('age: integer("age"),')
    expect(code).toContain('createdAt: timestamp("createdAt", { mode: \'date\' }).defaultNow().notNull(),')
    expect(code).toContain('active: boolean("active").default(true).notNull(),')
  })
})
