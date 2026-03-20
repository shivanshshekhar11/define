import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runGenerateDb } from '../src/generate-db.js'

const tempDirs: string[] = []

const createTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'define-cli-test-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

describe('runGenerateDb', () => {
  it('discovers resources and writes drizzle schema file', async () => {
    const cwd = await createTempDir()
    const resourcesDir = path.join(cwd, 'src', 'resources')

    await fs.mkdir(resourcesDir, { recursive: true })

    await fs.writeFile(
      path.join(resourcesDir, 'user.ts'),
      [
        "import { datetime, id, resource, string } from '@define/core'",
        '',
        "export const User = resource('User', {",
        "  table: 'users',",
        '  fields: {',
        '    id: id(),',
        "    email: string().email().unique(),",
        "    name: string().min(2).max(50),",
        "    createdAt: datetime().defaultNow(),",
        '  },',
        '})',
        '',
      ].join('\n'),
      'utf8',
    )

    const result = await runGenerateDb({
      cwd,
      resourcePatterns: ['src/resources/**/*.ts'],
      outFile: '.tool/generated/drizzle-schema.ts',
    })

    const generated = await fs.readFile(result.outFilePath, 'utf8')

    expect(result.resourceCount).toBe(1)
    expect(generated).toContain('export const users = pgTable("users", {')
    expect(generated).toContain('email: text("email").notNull().unique(),')
  })
})
