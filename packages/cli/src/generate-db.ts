import fs from 'node:fs/promises'
import path from 'node:path'

import { generateDrizzleSchema } from '@define-js/adapter-drizzle'

import { discoverResourceFiles, loadResourceMetas } from './resource-loader.js'
import { ensureDirectoryForFile } from './utils.js'

export interface GenerateDbOptions {
  cwd: string
  resourcePatterns: string[]
  outFile: string
}

export interface GenerateDbResult {
  resourceCount: number
  outFilePath: string
}

export const runGenerateDb = async (options: GenerateDbOptions): Promise<GenerateDbResult> => {
  const resourceFiles = await discoverResourceFiles({
    cwd: options.cwd,
    patterns: options.resourcePatterns,
  })

  const resources = await loadResourceMetas(resourceFiles, options.cwd)

  if (resources.length === 0) {
    throw new Error(
      `No resources found. Checked patterns: ${options.resourcePatterns.join(', ')}`,
    )
  }

  const { code } = generateDrizzleSchema({ resources })

  const outFilePath = path.resolve(options.cwd, options.outFile)
  await ensureDirectoryForFile(outFilePath)
  await fs.writeFile(outFilePath, `${code}\n`, 'utf8')

  return {
    resourceCount: resources.length,
    outFilePath,
  }
}
