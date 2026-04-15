import fs from 'node:fs/promises'
import path from 'node:path'

import { generateRepositoryArtifacts } from '@define-js/adapter-drizzle'

import { discoverResourceFiles, loadResourceMetas } from './resource-loader.js'
import { ensureDirectory } from './utils.js'

export interface GenerateReposOptions {
  cwd: string
  resourcePatterns: string[]
  outDir: string
  schemaImportPath: string
  dbImportPath: string
}

export interface GenerateReposResult {
  resourceCount: number
  outDirPath: string
  writtenFiles: string[]
}

export const runGenerateRepos = async (
  options: GenerateReposOptions,
): Promise<GenerateReposResult> => {
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

  const outDirPath = path.resolve(options.cwd, options.outDir)

  await ensureDirectory(outDirPath)

  const { files } = generateRepositoryArtifacts({
    resources,
    schemaImportPath: options.schemaImportPath,
    dbImportPath: options.dbImportPath,
  })

  const writtenFiles: string[] = []

  for (const file of files) {
    const targetFile = path.join(outDirPath, file.path)
    await fs.writeFile(targetFile, `${file.code}\n`, 'utf8')
    writtenFiles.push(targetFile)
  }

  return {
    resourceCount: resources.length,
    outDirPath,
    writtenFiles,
  }
}
