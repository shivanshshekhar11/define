import fs from 'node:fs/promises'
import path from 'node:path'

import { generateDrizzleSchema } from '@define/adapter-drizzle'

import { discoverResourceFiles, loadResourceMetas } from './resource-loader.js'

export interface GenerateDbOptions {
  cwd: string
  resourcePatterns: string[]
  outFile: string
}

export interface GenerateDbResult {
  resourceCount: number
  outFilePath: string
}

const ensureDirectory = async (targetFile: string): Promise<void> => {
  const dir = path.dirname(targetFile)
  await fs.mkdir(dir, { recursive: true })
}

export const runGenerateDb = async (options: GenerateDbOptions): Promise<GenerateDbResult> => {
  const resourceFiles = await discoverResourceFiles({
    cwd: options.cwd,
    patterns: options.resourcePatterns,
  })

  const resources = await loadResourceMetas(resourceFiles)

  if (resources.length === 0) {
    throw new Error(
      `No resources found. Checked patterns: ${options.resourcePatterns.join(', ')}`,
    )
  }

  const { code } = generateDrizzleSchema({ resources })

  const outFilePath = path.resolve(options.cwd, options.outFile)
  await ensureDirectory(outFilePath)
  await fs.writeFile(outFilePath, `${code}\n`, 'utf8')

  return {
    resourceCount: resources.length,
    outFilePath,
  }
}
