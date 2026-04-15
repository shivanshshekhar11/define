import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { getResourceMeta, type ResourceDefinition } from '@define-js/core'
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

export const loadResourceMetas = async (files: string[], cwd?: string) => {
  // Find the actual project root by looking for node_modules or package.json
  const findProjectRoot = (startDir: string): string => {
    let currentDir = startDir
    while (currentDir !== path.dirname(currentDir)) {
      const nodeModulesPath = path.join(currentDir, 'node_modules')
      const packageJsonPath = path.join(currentDir, 'package.json')
      if (fs.existsSync(nodeModulesPath) || fs.existsSync(packageJsonPath)) {
        return currentDir
      }
      currentDir = path.dirname(currentDir)
    }
    return startDir
  }

  const baseDir = cwd ?? (files.length > 0 ? path.dirname(files[0]!) : path.resolve('.'))
  const projectRoot = findProjectRoot(baseDir)
  
  // Try to resolve @define-js/core from the project root to get the actual path
  let coreModulePath: string | undefined
  try {
    // Try to resolve from the current process (test environment)
    coreModulePath = path.dirname(require.resolve('@define-js/core/package.json'))
  } catch {
    // Fallback if not found
  }
  
  const jitiOptions: {
    interopDefault: boolean
    moduleCache: boolean
    alias?: Record<string, string>
  } = {
    interopDefault: true,
    moduleCache: false,
  }

  if (coreModulePath) {
    jitiOptions.alias = {
      '@define-js/core': coreModulePath,
    }
  }
  
  const jiti = createJiti(pathToFileURL(projectRoot).href, jitiOptions)

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
