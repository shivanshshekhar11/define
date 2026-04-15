import fs from 'node:fs/promises'
import path from 'node:path'

import { generateDrizzleSchema, generateRepositoryArtifacts } from '@define/adapter-drizzle'
import { generateOpenApiDocument } from '@define/adapter-openapi'

import { discoverResourceFiles, loadResourceMetas } from './resource-loader.js'
import { ensureDirectory, ensureDirectoryForFile } from './utils.js'

export interface GenerateAllOptions {
  cwd: string
  resourcePatterns: string[]
  dbOutFile: string
  reposOutDir: string
  schemaImportPath: string
  dbImportPath: string
  openApiOutFile: string
  openApiTitle: string
  openApiVersion: string
}

export interface GenerateAllResult {
  resourceCount: number
  dbOutFilePath: string
  reposOutDirPath: string
  openApiOutFilePath: string
}

export const runGenerateAll = async (
  options: GenerateAllOptions,
): Promise<GenerateAllResult> => {
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

  // DB schema
  const { code: dbCode } = generateDrizzleSchema({ resources })
  const dbOutFilePath = path.resolve(options.cwd, options.dbOutFile)
  await ensureDirectoryForFile(dbOutFilePath)
  await fs.writeFile(dbOutFilePath, `${dbCode}\n`, 'utf8')

  // Repository artifacts
  const reposOutDirPath = path.resolve(options.cwd, options.reposOutDir)
  await ensureDirectory(reposOutDirPath)
  const { files: repoFiles } = generateRepositoryArtifacts({
    resources,
    schemaImportPath: options.schemaImportPath,
    dbImportPath: options.dbImportPath,
  })
  for (const file of repoFiles) {
    const targetFile = path.join(reposOutDirPath, file.path)
    await fs.writeFile(targetFile, `${file.code}\n`, 'utf8')
  }

  // OpenAPI
  const openapi = generateOpenApiDocument({
    resources,
    info: {
      title: options.openApiTitle,
      version: options.openApiVersion,
    },
  })
  const openApiOutFilePath = path.resolve(options.cwd, options.openApiOutFile)
  await ensureDirectoryForFile(openApiOutFilePath)
  await fs.writeFile(openApiOutFilePath, `${JSON.stringify(openapi, null, 2)}\n`, 'utf8')

  return {
    resourceCount: resources.length,
    dbOutFilePath,
    reposOutDirPath,
    openApiOutFilePath,
  }
}
