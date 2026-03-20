import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { runInitProject } from '../src/init.js'

const tempDirs: string[] = []

const createTempDir = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'define-cli-init-test-'))
  tempDirs.push(dir)
  return dir
}

afterEach(async () => {
  for (const dir of tempDirs.splice(0, tempDirs.length)) {
    await fs.rm(dir, { recursive: true, force: true })
  }
})

describe('runInitProject', () => {
  it('scaffolds a starter fastify+drizzle app structure', async () => {
    const cwd = await createTempDir()

    const result = await runInitProject({
      cwd,
      appName: 'demo-app',
      force: false,
    })

    expect(result.createdFiles.length).toBeGreaterThanOrEqual(6)

    const packageJson = await fs.readFile(path.join(cwd, 'package.json'), 'utf8')
    expect(packageJson).toContain('demo-app')

    await expect(fs.access(path.join(cwd, 'src', 'resources', 'user.ts'))).resolves.toBeUndefined()
    await expect(fs.access(path.join(cwd, 'src', 'db', 'client.ts'))).resolves.toBeUndefined()
    await expect(fs.access(path.join(cwd, 'src', 'server.ts'))).resolves.toBeUndefined()
    await expect(fs.access(path.join(cwd, 'drizzle.config.ts'))).resolves.toBeUndefined()
  })

  it('skips existing files when force is false', async () => {
    const cwd = await createTempDir()

    await fs.mkdir(path.join(cwd, 'src', 'resources'), { recursive: true })
    await fs.writeFile(path.join(cwd, 'src', 'resources', 'user.ts'), '// existing\n', 'utf8')

    const result = await runInitProject({
      cwd,
      appName: 'demo-app',
      force: false,
    })

    expect(result.skippedFiles.some((file) => file.endsWith(path.join('src', 'resources', 'user.ts')))).toBe(true)

    const content = await fs.readFile(path.join(cwd, 'src', 'resources', 'user.ts'), 'utf8')
    expect(content).toBe('// existing\n')
  })
})
