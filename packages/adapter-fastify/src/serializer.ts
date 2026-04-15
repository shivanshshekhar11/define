import { getResourceMeta, type ResourceDefinition, type ResourceFields } from '@define-js/core'

export type SerializedResourceRow = Record<string, unknown>

const serializeValue = (value: unknown): unknown => {
  if (value instanceof Date) {
    return value.toISOString()
  }

  return value
}

export const createResourceSerializer = <
  TResource extends ResourceDefinition<string, string, ResourceFields>,
>(
  resource: TResource,
): ((row: unknown) => SerializedResourceRow) => {
  const meta = getResourceMeta(resource)

  return (row: unknown): SerializedResourceRow => {
    if (typeof row !== 'object' || row === null || Array.isArray(row)) {
      return {}
    }

    const source = row as Record<string, unknown>
    const output: SerializedResourceRow = {}

    for (const [fieldName, field] of Object.entries(meta.fields)) {
      if (field.hidden || field.internal) {
        continue
      }

      if (!(fieldName in source)) {
        continue
      }

      output[fieldName] = serializeValue(source[fieldName])
    }

    return output
  }
}

export const serializeResource = <
  TResource extends ResourceDefinition<string, string, ResourceFields>,
>(
  resource: TResource,
  row: unknown,
): SerializedResourceRow => createResourceSerializer(resource)(row)
