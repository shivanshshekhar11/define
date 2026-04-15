import {
  datetime,
  id,
  resource,
  string,
  type ResourceDefinition,
  type ResourceFields,
} from '@define-js/core'

export const User: ResourceDefinition<'User', 'users', ResourceFields> = resource('User', {
  table: 'users',
  fields: {
    id: id(),
    email: string().email().unique(),
    name: string().min(2).max(50),
    createdAt: datetime().defaultNow(),
  },
})
