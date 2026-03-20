# Contributing

Thanks for your interest in contributing to Define.

## Development Setup

1. Install prerequisites:
   - Node.js 20+
   - pnpm 10+
2. Install dependencies:

```bash
pnpm install
```

3. Run checks:

```bash
pnpm build
pnpm test
pnpm test:types
```

## Local Workflow

1. Make focused changes.
2. Add or update tests.
3. Ensure all checks pass.
4. Update docs for user-facing changes.

## Pull Requests

1. Use clear titles and descriptions.
2. Link related issues.
3. Call out breaking changes.
4. Include sample usage when adding APIs.

## Commit Guidance

Conventional commits are recommended:

- `feat: ...`
- `fix: ...`
- `docs: ...`
- `refactor: ...`
- `test: ...`

## Release Notes

When adding user-facing features, include a short summary in the PR describing:

- What changed
- Why it changed
- How to use it
