import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runGenerateOpenApi } from '../src/generate-openapi.js'

const tempDirs: string[] = []

const createTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'define-cli-openapi-test-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

describe('runGenerateOpenApi', () => {
  it('discovers resources and writes openapi json', async () => {
    const cwd = await createTempDir()
    const resourcesDir = path.join(cwd, 'src', 'resources')

    await fs.mkdir(resourcesDir, { recursive: true })

    await fs.writeFile(
      path.join(resourcesDir, 'user.ts'),
      [
        "import { datetime, id, resource, string } from '@define-js/core'",
        '',
        "export const User = resource('User', {",
        "  table: 'users',",
        '  fields: {',
        '    id: id(),',
        "    email: string().email().unique(),",
        "    passwordHash: string().internal(),",
        "    createdAt: datetime().defaultNow(),",
        '  },',
        '})',
        '',
      ].join('\n'),
      'utf8',
    )

    const result = await runGenerateOpenApi({
      cwd,
      resourcePatterns: ['src/resources/**/*.ts'],
      outFile: '.tool/generated/openapi.json',
      title: 'Temp API',
      version: '0.1.0',
    })

    const generatedRaw = await fs.readFile(result.outFilePath, 'utf8')
    const generated = JSON.parse(generatedRaw) as {
      info: { title: string }
      components: { schemas: Record<string, unknown> }
    }

    expect(result.resourceCount).toBe(1)
    expect(generated.info.title).toBe('Temp API')
    expect(generated.components.schemas.UserResponse).toBeDefined()
  })
})
