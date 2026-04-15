import { getResourceMeta, type ResourceDefinition, type ResourceFields } from '@define-js/core'

interface JsonSchema {
  [key: string]: unknown
}

export interface ResourceJsonSchemas {
  createBodyJsonSchema: JsonSchema
  updateBodyJsonSchema: JsonSchema
  responseJsonSchema: JsonSchema
  idParamJsonSchema: JsonSchema
}

const baseSchemaForField = (kind: string): JsonSchema => {
  if (kind === 'string') {
    return { type: 'string' }
  }

  if (kind === 'id' || kind === 'int') {
    return { type: 'integer' }
  }

  if (kind === 'boolean') {
    return { type: 'boolean' }
  }

  if (kind === 'datetime') {
    return { type: 'string', format: 'date-time' }
  }

  return { type: 'string' }
}

const withNullable = (schema: JsonSchema, nullable: boolean): JsonSchema => {
  if (!nullable) {
    return schema
  }

  return {
    anyOf: [schema, { type: 'null' }],
  }
}

const applyConstraints = (
  schema: JsonSchema,
  validations: Array<{ kind: string; value?: number }>,
): JsonSchema => {
  const output = { ...schema }

  for (const rule of validations) {
    if (rule.kind === 'email') {
      output.format = 'email'
    }

    if (rule.kind === 'min' && typeof rule.value === 'number') {
      if (schema.type === 'string') {
        output.minLength = rule.value
      }

      if (schema.type === 'integer') {
        output.minimum = rule.value
      }
    }

    if (rule.kind === 'max' && typeof rule.value === 'number') {
      if (schema.type === 'string') {
        output.maxLength = rule.value
      }

      if (schema.type === 'integer') {
        output.maximum = rule.value
      }
    }
  }

  return output
}

const buildProperties = (
  fields: Record<string, { kind: string; nullable: boolean; validations: Array<{ kind: string; value?: number }> }>,
): Record<string, JsonSchema> => {
  const properties: Record<string, JsonSchema> = {}

  for (const [fieldName, field] of Object.entries(fields)) {
    const base = baseSchemaForField(field.kind)
    const withRules = applyConstraints(base, field.validations)
    properties[fieldName] = withNullable(withRules, field.nullable)
  }

  return properties
}

export const generateResourceJsonSchemas = <
  TResource extends ResourceDefinition<string, string, ResourceFields>,
>(
  resource: TResource,
): ResourceJsonSchemas => {
  const meta = getResourceMeta(resource)
  const properties = buildProperties(meta.fields)
  const apiFieldEntries = Object.entries(meta.fields).filter(([, field]) => !field.hidden && !field.internal)

  const createRequired = apiFieldEntries
    .filter(([, field]) => !field.optional && !field.autoIncrement && field.defaultValue === undefined)
    .map(([name]) => name)

  const createProperties: Record<string, JsonSchema> = {}

  for (const [fieldName] of apiFieldEntries) {
    createProperties[fieldName] = properties[fieldName]!
  }

  const updateProperties: Record<string, JsonSchema> = {}

  for (const [fieldName, field] of apiFieldEntries) {
    if (!field.updatable) {
      continue
    }

    updateProperties[fieldName] = properties[fieldName]!
  }

  const responseProperties: Record<string, JsonSchema> = {}
  const responseRequired: string[] = []

  for (const [fieldName] of apiFieldEntries) {
    responseProperties[fieldName] = properties[fieldName]!
    responseRequired.push(fieldName)
  }

  const primaryField = Object.entries(meta.fields).find(([, field]) => field.primary)?.[0] ?? 'id'
  const primaryIsString = meta.fields[primaryField]?.kind === 'string'

  return {
    createBodyJsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: createRequired,
      properties: createProperties,
    },
    updateBodyJsonSchema: {
      type: 'object',
      additionalProperties: false,
      properties: updateProperties,
    },
    responseJsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: responseRequired,
      properties: responseProperties,
    },
    idParamJsonSchema: {
      type: 'object',
      additionalProperties: false,
      required: [primaryField],
      properties: {
        [primaryField]: primaryIsString
          ? { type: 'string' }
          : { type: 'string', pattern: '^[0-9]+$' },
      },
    },
  }
}
