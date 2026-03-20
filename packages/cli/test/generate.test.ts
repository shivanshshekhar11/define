import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runGenerateAll } from '../src/generate.js'

const tempDirs: string[] = []

const createTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'define-cli-generate-all-test-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

describe('runGenerateAll', () => {
  it('runs db, repos, and openapi generators together', async () => {
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

    const result = await runGenerateAll({
      cwd,
      resourcePatterns: ['src/resources/**/*.ts'],
      dbOutFile: '.tool/generated/drizzle-schema.ts',
      reposOutDir: '.tool/generated',
      schemaImportPath: './drizzle-schema',
      dbImportPath: '../../src/db/client',
      openApiOutFile: '.tool/generated/openapi.json',
      openApiTitle: 'Temp API',
      openApiVersion: '0.1.0',
    })

    expect(result.resourceCount).toBe(1)

    await expect(fs.access(result.dbOutFilePath)).resolves.toBeUndefined()
    await expect(fs.access(path.join(result.reposOutDirPath, 'user.repo.ts'))).resolves.toBeUndefined()
    await expect(fs.access(result.openApiOutFilePath)).resolves.toBeUndefined()
  })
})
