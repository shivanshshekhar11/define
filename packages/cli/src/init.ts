import fs from 'node:fs/promises'
import path from 'node:path'

export interface InitProjectOptions {
  cwd: string
  appName: string
  force: boolean
}

export interface InitProjectResult {
  createdFiles: string[]
  skippedFiles: string[]
}

const DEFAULT_PACKAGE_JSON = (appName: string): string => JSON.stringify({
  name: appName,
  private: true,
  version: '0.1.0',
  type: 'module',
  scripts: {
    generate: 'define generate --cwd .',
    'generate:db': 'define generate:db --cwd .',
    'generate:repos': 'define generate:repos --cwd .',
    'generate:openapi': 'define generate:openapi --cwd . --title "Define API" --version 0.1.0',
    dev: 'node src/server.ts',
  },
  dependencies: {
    '@define/core': '^0.1.0',
    '@define/adapter-fastify': '^0.1.0',
    fastify: '^5.2.1',
  },
  devDependencies: {
    'drizzle-kit': '^0.30.6',
    'drizzle-orm': '^0.44.6',
    pg: '^8.13.3',
  },
}, null, 2) + '\n'

const DEFAULT_RESOURCE = [
  "import { datetime, id, resource, string } from '@define-js/core'",
  '',
  "export const User = resource('User', {",
  "  table: 'users',",
  '  fields: {',
  '    id: id(),',
  "    email: string().email().unique(),",
  "    name: string().min(2).max(50),",
  "    createdAt: datetime().defaultNow(),",
  '  },',
  '})',
  '',
].join('\n')

const DEFAULT_DB_CLIENT = [
  '// Placeholder DB client used by generated repositories.',
  'export const db = {',
  '  insert: () => ({',
  '    values: () => ({',
  '      returning: async () => [],',
  '    }),',
  '  }),',
  '  select: () => ({',
  '    from: () =>',
  '      Object.assign(Promise.resolve([]), {',
  '        where: async () => [],',
  '      }),',
  '  }),',
  '  update: () => ({',
  '    set: () => ({',
  '      where: () => ({',
  '        returning: async () => [],',
  '      }),',
  '    }),',
  '  }),',
  '}',
  '',
].join('\n')

const DEFAULT_DRIZZLE_CONFIG = [
  "import { defineConfig } from 'drizzle-kit'",
  '',
  'export default defineConfig({',
  "  dialect: 'postgresql',",
  "  schema: './.tool/generated/drizzle-schema.ts',",
  "  out: './drizzle',",
  '  dbCredentials: {',
  "    url: process.env.DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/define',",
  '  },',
  '})',
  '',
].join('\n')

const DEFAULT_SERVER = [
  "import Fastify from 'fastify'",
  '',
  "import { registerCRUDRoutes } from '@define-js/adapter-fastify'",
  '',
  "import { UserRepo } from '../.tool/generated/user.repo.js'",
  "import { User } from './resources/user.js'",
  '',
  'const start = async (): Promise<void> => {',
  '  const app = Fastify({ logger: true })',
  '',
  '  await registerCRUDRoutes({',
  '    fastify: app,',
  '    resource: User,',
  '    repository: UserRepo,',
  '  })',
  '',
  '  await app.listen({',
  '    port: 3000,',
  "    host: '0.0.0.0',",
  '  })',
  '}',
  '',
  'start().catch((error) => {',
  '  console.error(error)',
  '  process.exit(1)',
  '})',
  '',
].join('\n')

const DEFAULT_TSCONFIG = JSON.stringify({
  compilerOptions: {
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    strict: true,
    skipLibCheck: true,
  },
  include: ['src/**/*.ts', '.tool/generated/**/*.ts', 'drizzle.config.ts'],
}, null, 2) + '\n'

const writeIfNeeded = async (
  filePath: string,
  content: string,
  force: boolean,
): Promise<'created' | 'skipped'> => {
  try {
    await fs.access(filePath)

    if (!force) {
      return 'skipped'
    }
  } catch {
    // File does not exist.
  }

  await fs.mkdir(path.dirname(filePath), { recursive: true })
  await fs.writeFile(filePath, content, 'utf8')
  return 'created'
}

export const runInitProject = async (
  options: InitProjectOptions,
): Promise<InitProjectResult> => {
  const createdFiles: string[] = []
  const skippedFiles: string[] = []

  const files: Array<{ relativePath: string; content: string }> = [
    { relativePath: 'package.json', content: DEFAULT_PACKAGE_JSON(options.appName) },
    { relativePath: 'src/resources/user.ts', content: DEFAULT_RESOURCE },
    { relativePath: 'src/db/client.ts', content: DEFAULT_DB_CLIENT },
    { relativePath: 'src/server.ts', content: DEFAULT_SERVER },
    { relativePath: 'drizzle.config.ts', content: DEFAULT_DRIZZLE_CONFIG },
    { relativePath: 'tsconfig.json', content: DEFAULT_TSCONFIG },
  ]

  for (const file of files) {
    const filePath = path.resolve(options.cwd, file.relativePath)
    const result = await writeIfNeeded(filePath, file.content, options.force)

    if (result === 'created') {
      createdFiles.push(filePath)
    } else {
      skippedFiles.push(filePath)
    }
  }

  return {
    createdFiles,
    skippedFiles,
  }
}
