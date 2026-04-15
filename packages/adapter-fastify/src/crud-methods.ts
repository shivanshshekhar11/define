import { getResourceMeta, type ResourceDefinition, type ResourceFields } from '@define/core'

import { ValidationError } from './errors.js'
import { generateResourceJsonSchemas, type ResourceJsonSchemas } from './json-schema.js'
import { createResourceSerializer, type SerializedResourceRow } from './serializer.js'
import { validateCreate, validateUpdate } from './validation.js'

export interface CrudRepository<TRow, TInsert, TUpdate> {
  insert: (input: TInsert) => Promise<TRow>
  findById: (id: unknown) => Promise<TRow | null>
  findMany: () => Promise<TRow[]>
  updateById: (id: unknown, patch: TUpdate) => Promise<TRow | null>
}

export interface CrudErrorBody {
  message: string
  issues?: string[]
}

export interface CrudMethodResult<TBody> {
  statusCode: number
  body: TBody
}

export interface CrudMethods {
  create: (body: unknown) => Promise<CrudMethodResult<SerializedResourceRow | CrudErrorBody>>
  findMany: () => Promise<CrudMethodResult<SerializedResourceRow[]>>
  findById: (params: Record<string, unknown>) => Promise<CrudMethodResult<SerializedResourceRow | CrudErrorBody>>
  updateById: (params: Record<string, unknown>, body: unknown) => Promise<CrudMethodResult<SerializedResourceRow | CrudErrorBody>>
}

export interface CreateCrudMethodsOptions<
  TResource extends ResourceDefinition<string, string, ResourceFields>,
  TRow,
  TInsert,
  TUpdate,
> {
  resource: TResource
  repository: CrudRepository<TRow, TInsert, TUpdate>
}

export interface CreateCrudMethodsResult {
  primaryField: string
  schemas: ResourceJsonSchemas
  methods: CrudMethods
}

const parsePrimaryParam = (value: unknown, kind: string): unknown => {
  if (kind === 'string') {
    if (typeof value !== 'string') {
      throw new Error('Invalid route param')
    }

    return value
  }

  const numericValue = Number(value)

  if (!Number.isInteger(numericValue)) {
    throw new Error('Invalid route param')
  }

  return numericValue
}

export const createCRUDMethods = <
  TResource extends ResourceDefinition<string, string, ResourceFields>,
  TRow,
  TInsert,
  TUpdate,
>({
  resource,
  repository,
}: CreateCrudMethodsOptions<TResource, TRow, TInsert, TUpdate>): CreateCrudMethodsResult => {
  const meta = getResourceMeta(resource)
  const schemas = generateResourceJsonSchemas(resource)
  const serialize = createResourceSerializer(resource)
  const primaryField = Object.entries(meta.fields).find(([, field]) => field.primary)?.[0] ?? 'id'
  const primaryKind = meta.fields[primaryField]?.kind ?? 'int'

  return {
    primaryField,
    schemas,
    methods: {
      create: async (body) => {
        let input: TInsert

        try {
          input = validateCreate(resource, body) as unknown as TInsert
        } catch (error) {
          if (error instanceof ValidationError) {
            return {
              statusCode: 400,
              body: {
                message: error.message,
                issues: error.issues,
              },
            }
          }

          throw error
        }

        const created = await repository.insert(input)
        return {
          statusCode: 201,
          body: serialize(created),
        }
      },

      findMany: async () => {
        const rows = await repository.findMany()
        return {
          statusCode: 200,
          body: rows.map((row) => serialize(row)),
        }
      },

      findById: async (params) => {
        let id: unknown

        try {
          id = parsePrimaryParam(params[primaryField], primaryKind)
        } catch {
          return {
            statusCode: 400,
            body: { message: `Invalid ${primaryField}` },
          }
        }

        const row = await repository.findById(id)

        if (!row) {
          return {
            statusCode: 404,
            body: { message: `${meta.name} not found` },
          }
        }

        return {
          statusCode: 200,
          body: serialize(row),
        }
      },

      updateById: async (params, body) => {
        let id: unknown

        try {
          id = parsePrimaryParam(params[primaryField], primaryKind)
        } catch {
          return {
            statusCode: 400,
            body: { message: `Invalid ${primaryField}` },
          }
        }

        let patch: TUpdate

        try {
          patch = validateUpdate(resource, body) as unknown as TUpdate
        } catch (error) {
          if (error instanceof ValidationError) {
            return {
              statusCode: 400,
              body: {
                message: error.message,
                issues: error.issues,
              },
            }
          }

          throw error
        }

        const row = await repository.updateById(id, patch)

        if (!row) {
          return {
            statusCode: 404,
            body: { message: `${meta.name} not found` },
          }
        }

        return {
          statusCode: 200,
          body: serialize(row),
        }
      },
    },
  }
}
