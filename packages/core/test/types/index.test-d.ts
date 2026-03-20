import { expectAssignable } from 'tsd'

import {
  boolean,
  datetime,
  id,
  int,
  resource,
  string,
  type InferInsert,
  type InferRow,
  type InferUpdate,
} from '../../src/index.js'

const User = resource('User', {
  table: 'users',
  fields: {
    id: id(),
    email: string().email().unique(),
    name: string().min(2).max(50),
    age: int().nullable().optional(),
    active: boolean().default(true),
    createdAt: datetime().defaultNow(),
  },
})

type UserInsert = InferInsert<typeof User>
type UserRow = InferRow<typeof User>
type UserUpdate = InferUpdate<typeof User>

expectAssignable<{
  id?: number
  email: string
  name: string
  age?: number | null
  active?: boolean
  createdAt?: Date
}>({
  email: 'x@example.com',
  name: 'X',
})

expectAssignable<UserInsert>({
  email: 'x@example.com',
  name: 'X',
})

expectAssignable<UserRow>({
  id: 1,
  email: 'x@example.com',
  name: 'X',
  age: null,
  active: true,
  createdAt: new Date(),
})

expectAssignable<Partial<{
  email: string
  name: string
  age: number | null
  active: boolean
  createdAt: Date
}>>({
  name: 'Renamed',
})

expectAssignable<UserUpdate>({
  email: 'next@example.com',
  age: null,
})
