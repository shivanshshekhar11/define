import { runGenerateDb } from './generate-db.js'
import { runGenerateOpenApi } from './generate-openapi.js'
import { runGenerateRepos } from './generate-repos.js'

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
  const dbResult = await runGenerateDb({
    cwd: options.cwd,
    resourcePatterns: options.resourcePatterns,
    outFile: options.dbOutFile,
  })

  const reposResult = await runGenerateRepos({
    cwd: options.cwd,
    resourcePatterns: options.resourcePatterns,
    outDir: options.reposOutDir,
    schemaImportPath: options.schemaImportPath,
    dbImportPath: options.dbImportPath,
  })

  const openApiResult = await runGenerateOpenApi({
    cwd: options.cwd,
    resourcePatterns: options.resourcePatterns,
    outFile: options.openApiOutFile,
    title: options.openApiTitle,
    version: options.openApiVersion,
  })

  return {
    resourceCount: dbResult.resourceCount,
    dbOutFilePath: dbResult.outFilePath,
    reposOutDirPath: reposResult.outDirPath,
    openApiOutFilePath: openApiResult.outFilePath,
  }
}
