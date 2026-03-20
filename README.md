# define

Define resources once in TypeScript and generate consistent database, API, and docs artifacts.

Define helps you keep schema, validation, route contracts, and OpenAPI docs in sync without hand-maintaining multiple sources of truth.

## Features

- Type-safe resource DSL (`@define/core`)
- Drizzle schema generation (`@define/adapter-drizzle`)
- Typed repository generation (`@define/adapter-drizzle`)
- Fastify validation, JSON schema, and serializer helpers (`@define/adapter-fastify`)
- OpenAPI 3.1 generation (`@define/adapter-openapi`)
- CLI scaffold + generation commands (`@define/cli`)

## Monorepo Packages

- `@define/core`
- `@define/adapter-drizzle`
- `@define/adapter-fastify`
- `@define/adapter-openapi`
- `@define/cli`

## Requirements

- Node.js 20+
- pnpm 10+

## Quick Start (Repository)

1. Install dependencies:

```bash
pnpm install
```

2. Run checks:

```bash
pnpm build
pnpm test
pnpm test:types
```

3. Generate artifacts for the example app:

```bash
pnpm --filter @define/example-fastify-drizzle-app generate
```

Generated outputs are written to:

- `examples/fastify-drizzle-app/.tool/generated/drizzle-schema.ts`
- `examples/fastify-drizzle-app/.tool/generated/*.types.ts`
- `examples/fastify-drizzle-app/.tool/generated/*.repo.ts`
- `examples/fastify-drizzle-app/.tool/generated/openapi.json`

## CLI Usage

### Scaffold

```bash
define init --cwd ./my-app --name my-app
```

### Generate all artifacts

```bash
define generate --cwd ./my-app
```

### Generate specific artifacts

```bash
define generate:db --cwd ./my-app
define generate:repos --cwd ./my-app
define generate:openapi --cwd ./my-app --title "My API" --version 1.0.0
```

### Root scripts in this repo

```bash
pnpm init
pnpm generate
pnpm generate:db
pnpm generate:repos
pnpm generate:openapi
```

## Resource DSL Example

```ts
import { datetime, id, resource, string } from '@define/core'

export const User = resource('User', {
	table: 'users',
	fields: {
		id: id(),
		email: string().email().unique(),
		name: string().min(2).max(50),
		createdAt: datetime().defaultNow(),
		passwordHash: string().internal(),
	},
})
```

## Fastify Integration Pattern

Use reusable CRUD methods (recommended for dynamic per-route logic):

```ts
import { createCRUDMethods } from '@define/adapter-fastify'

const { primaryField, schemas, methods } = createCRUDMethods({
	resource: User,
	repository: UserRepo,
})

app.post('/users', { schema: { body: schemas.createBodyJsonSchema } }, async (req, reply) => {
	const result = await methods.create(req.body)
	return reply.code(result.statusCode as 201 | 400).send(result.body)
})
```

`registerCRUDRoutes` is still available as optional convenience if you want full auto-registration.

## Architecture

- `packages/core`: DSL, metadata model, inferred types
- `packages/adapter-drizzle`: Drizzle + repository generation
- `packages/adapter-fastify`: validators, schemas, serializers, CRUD method helpers
- `packages/adapter-openapi`: OpenAPI generator
- `packages/cli`: orchestration + scaffolding
- `examples/fastify-drizzle-app`: working reference app

## Contributing

See `CONTRIBUTING.md` for setup and workflow.

## License

MIT, see `LICENSE`.
