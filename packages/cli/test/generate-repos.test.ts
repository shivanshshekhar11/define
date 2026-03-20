import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runGenerateRepos } from '../src/generate-repos.js'

const tempDirs: string[] = []

const createTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'define-cli-repos-test-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

describe('runGenerateRepos', () => {
  it('discovers resources and writes repository artifacts', async () => {
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
        "    createdAt: datetime().defaultNow(),",
        '  },',
        '})',
        '',
      ].join('\n'),
      'utf8',
    )

    const result = await runGenerateRepos({
      cwd,
      resourcePatterns: ['src/resources/**/*.ts'],
      outDir: '.tool/generated',
      schemaImportPath: './drizzle-schema',
      dbImportPath: '../../src/db/client',
    })

    expect(result.resourceCount).toBe(1)

    const userRepo = await fs.readFile(path.join(result.outDirPath, 'user.repo.ts'), 'utf8')
    const userTypes = await fs.readFile(path.join(result.outDirPath, 'user.types.ts'), 'utf8')

    expect(userRepo).toContain('export const UserRepo = {')
    expect(userRepo).toContain("import { users } from './drizzle-schema'")
    expect(userTypes).toContain('export interface UserRow {')
  })
})
