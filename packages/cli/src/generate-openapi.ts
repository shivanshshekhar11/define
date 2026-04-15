import fs from 'node:fs/promises'
import path from 'node:path'

import { generateOpenApiDocument } from '@define/adapter-openapi'

import { discoverResourceFiles, loadResourceMetas } from './resource-loader.js'
import { ensureDirectoryForFile } from './utils.js'

export interface GenerateOpenApiOptions {
  cwd: string
  resourcePatterns: string[]
  outFile: string
  title: string
  version: string
}

export interface GenerateOpenApiResult {
  resourceCount: number
  outFilePath: string
}

export const runGenerateOpenApi = async (
  options: GenerateOpenApiOptions,
): Promise<GenerateOpenApiResult> => {
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

  const openapi = generateOpenApiDocument({
    resources,
    info: {
      title: options.title,
      version: options.version,
    },
  })

  const outFilePath = path.resolve(options.cwd, options.outFile)
  await ensureDirectoryForFile(outFilePath)
  await fs.writeFile(outFilePath, `${JSON.stringify(openapi, null, 2)}\n`, 'utf8')

  return {
    resourceCount: resources.length,
    outFilePath,
  }
}
