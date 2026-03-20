#!/usr/bin/env node
import path from 'node:path'
import process from 'node:process'

import { runGenerateDb } from './generate-db.js'
import { runGenerateAll } from './generate.js'
import { runGenerateOpenApi } from './generate-openapi.js'
import { runGenerateRepos } from './generate-repos.js'
import { runInitProject } from './init.js'

const DEFAULT_RESOURCES = ['src/resources/**/*.{ts,tsx,mts,cts,js,mjs,cjs}']
const DEFAULT_DB_OUT = '.tool/generated/drizzle-schema.ts'
const DEFAULT_OPENAPI_OUT = '.tool/generated/openapi.json'
const DEFAULT_REPOS_OUT_DIR = '.tool/generated'
const DEFAULT_SCHEMA_IMPORT = './drizzle-schema'
const DEFAULT_DB_IMPORT = '../../src/db/client'
const DEFAULT_OPENAPI_TITLE = 'Define API'
const DEFAULT_OPENAPI_VERSION = '0.1.0'
const DEFAULT_APP_NAME = 'define-app'

interface ParsedArgs {
  command: string | undefined
  cwd: string
  appName: string
  force: boolean
  resourcePatterns: string[]
  outFile: string
  dbOutFile: string
  openApiOutFile: string
  outDir: string
  schemaImportPath: string
  dbImportPath: string
  title: string
  version: string
}

const parseArgs = (argv: string[]): ParsedArgs => {
  const invocationCwd = process.env.INIT_CWD ?? process.cwd()

  const parsed: ParsedArgs = {
    command: argv[2],
    cwd: invocationCwd,
    appName: DEFAULT_APP_NAME,
    force: false,
    resourcePatterns: DEFAULT_RESOURCES,
    outFile: DEFAULT_DB_OUT,
    dbOutFile: DEFAULT_DB_OUT,
    openApiOutFile: DEFAULT_OPENAPI_OUT,
    outDir: DEFAULT_REPOS_OUT_DIR,
    schemaImportPath: DEFAULT_SCHEMA_IMPORT,
    dbImportPath: DEFAULT_DB_IMPORT,
    title: DEFAULT_OPENAPI_TITLE,
    version: DEFAULT_OPENAPI_VERSION,
  }

  for (let index = 3; index < argv.length; index += 1) {
    const current = argv[index]

    if (current === '--cwd') {
      parsed.cwd = path.resolve(invocationCwd, argv[index + 1] ?? '.')
      index += 1
      continue
    }

    if (current === '--resources') {
      parsed.resourcePatterns = (argv[index + 1] ?? '')
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
      index += 1
      continue
    }

    if (current === '--out') {
      parsed.outFile = argv[index + 1] ?? parsed.outFile
      index += 1
      continue
    }

    if (current === '--db-out') {
      parsed.dbOutFile = argv[index + 1] ?? parsed.dbOutFile
      index += 1
      continue
    }

    if (current === '--openapi-out') {
      parsed.openApiOutFile = argv[index + 1] ?? parsed.openApiOutFile
      index += 1
      continue
    }

    if (current === '--out-dir') {
      parsed.outDir = argv[index + 1] ?? parsed.outDir
      index += 1
      continue
    }

    if (current === '--schema-import') {
      parsed.schemaImportPath = argv[index + 1] ?? parsed.schemaImportPath
      index += 1
      continue
    }

    if (current === '--db-import') {
      parsed.dbImportPath = argv[index + 1] ?? parsed.dbImportPath
      index += 1
      continue
    }

    if (current === '--title') {
      parsed.title = argv[index + 1] ?? parsed.title
      index += 1
      continue
    }

    if (current === '--version') {
      parsed.version = argv[index + 1] ?? parsed.version
      index += 1
      continue
    }

    if (current === '--name') {
      parsed.appName = argv[index + 1] ?? parsed.appName
      index += 1
      continue
    }

    if (current === '--force') {
      parsed.force = true
    }
  }

  return parsed
}

const printUsage = (): void => {
  process.stdout.write(
    [
      'Usage:',
      '  define init [--cwd <dir>] [--name <app-name>] [--force]',
      '  define generate [--cwd <dir>] [--resources <glob1,glob2>] [--db-out <file>] [--out-dir <dir>] [--openapi-out <file>] [--title <name>] [--version <semver>] [--schema-import <path>] [--db-import <path>]',
      '  define generate:db [--cwd <dir>] [--resources <glob1,glob2>] [--out <file>]',
      '  define generate:repos [--cwd <dir>] [--resources <glob1,glob2>] [--out-dir <dir>] [--schema-import <path>] [--db-import <path>]',
      '  define generate:openapi [--cwd <dir>] [--resources <glob1,glob2>] [--out <file>] [--title <name>] [--version <semver>]',
      '',
      'Defaults:',
      `  --name ${DEFAULT_APP_NAME}`,
      `  --resources ${DEFAULT_RESOURCES.join(',')}`,
      `  --out (db) ${DEFAULT_DB_OUT}`,
      `  --out (openapi) ${DEFAULT_OPENAPI_OUT}`,
      `  --db-out ${DEFAULT_DB_OUT}`,
      `  --openapi-out ${DEFAULT_OPENAPI_OUT}`,
      `  --out-dir ${DEFAULT_REPOS_OUT_DIR}`,
      `  --schema-import ${DEFAULT_SCHEMA_IMPORT}`,
      `  --db-import ${DEFAULT_DB_IMPORT}`,
      `  --title ${DEFAULT_OPENAPI_TITLE}`,
      `  --version ${DEFAULT_OPENAPI_VERSION}`,
      '',
    ].join('\n'),
  )
}

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv)

  if (args.command === 'init') {
    const result = await runInitProject({
      cwd: args.cwd,
      appName: args.appName,
      force: args.force,
    })

    process.stdout.write(
      [
        `Initialized project in ${args.cwd}`,
        `Created ${result.createdFiles.length} file(s)`,
        `Skipped ${result.skippedFiles.length} file(s)`,
      ].join('\n') + '\n',
    )

    return
  }

  if (args.command === 'generate') {
    const result = await runGenerateAll({
      cwd: args.cwd,
      resourcePatterns: args.resourcePatterns,
      dbOutFile: args.dbOutFile,
      reposOutDir: args.outDir,
      schemaImportPath: args.schemaImportPath,
      dbImportPath: args.dbImportPath,
      openApiOutFile: args.openApiOutFile,
      openApiTitle: args.title,
      openApiVersion: args.version,
    })

    process.stdout.write(
      [
        `Generated artifacts for ${result.resourceCount} resource(s):`,
        `- DB schema: ${result.dbOutFilePath}`,
        `- Repositories: ${result.reposOutDirPath}`,
        `- OpenAPI: ${result.openApiOutFilePath}`,
      ].join('\n') + '\n',
    )

    return
  }

  if (args.command === 'generate:db') {
    const result = await runGenerateDb({
      cwd: args.cwd,
      resourcePatterns: args.resourcePatterns,
      outFile: args.outFile,
    })

    process.stdout.write(
      `Generated Drizzle schema for ${result.resourceCount} resource(s) at ${result.outFilePath}\n`,
    )

    return
  }

  if (args.command === 'generate:openapi') {
    const result = await runGenerateOpenApi({
      cwd: args.cwd,
      resourcePatterns: args.resourcePatterns,
      outFile: args.outFile === DEFAULT_DB_OUT ? DEFAULT_OPENAPI_OUT : args.outFile,
      title: args.title,
      version: args.version,
    })

    process.stdout.write(
      `Generated OpenAPI for ${result.resourceCount} resource(s) at ${result.outFilePath}\n`,
    )

    return
  }

  if (args.command === 'generate:repos') {
    const result = await runGenerateRepos({
      cwd: args.cwd,
      resourcePatterns: args.resourcePatterns,
      outDir: args.outDir,
      schemaImportPath: args.schemaImportPath,
      dbImportPath: args.dbImportPath,
    })

    process.stdout.write(
      `Generated repository artifacts for ${result.resourceCount} resource(s) in ${result.outDirPath}\n`,
    )

    return
  }

  printUsage()
  process.exitCode = 1
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`define command failed: ${message}\n`)
  process.exitCode = 1
})
