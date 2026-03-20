# @define/core

Core DSL and metadata model for Define.

## Install

```bash
pnpm add @define/core
```

## Example

```ts
import { datetime, id, resource, string } from '@define/core'

export const User = resource('User', {
  table: 'users',
  fields: {
    id: id(),
    email: string().email().unique(),
    name: string().min(2).max(50),
    createdAt: datetime().defaultNow(),
  },
})
```

This package powers type inference and runtime metadata that other adapters consume.
