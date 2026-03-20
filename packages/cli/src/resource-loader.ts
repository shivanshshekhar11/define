import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { getResourceMeta, type ResourceDefinition } from '@define/core'
import fg from 'fast-glob'
import { createJiti } from 'jiti'

interface DiscoverOptions {
  cwd: string
  patterns: string[]
}

const isResourceDefinition = (value: unknown): value is ResourceDefinition<string, string, Record<string, never>> => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  return '__meta' in value
}

export const discoverResourceFiles = async ({ cwd, patterns }: DiscoverOptions): Promise<string[]> => {
  const files = await fg(patterns, {
    cwd,
    absolute: true,
    onlyFiles: true,
    unique: true,
  })

  return files.sort()
}

export const loadResourceMetas = async (files: string[]) => {
  const jiti = createJiti(pathToFileURL(path.resolve('.')).href, {
    interopDefault: true,
    moduleCache: false,
  })

  const metas = []

  for (const filePath of files) {
    const moduleExports = await jiti.import(filePath)

    if (typeof moduleExports !== 'object' || moduleExports === null) {
      continue
    }

    for (const value of Object.values(moduleExports as Record<string, unknown>)) {
      if (!isResourceDefinition(value)) {
        continue
      }

      metas.push(getResourceMeta(value))
    }
  }

  return metas
}
