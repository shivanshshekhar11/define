import type { FieldMeta, ResourceMeta } from '@define-js/core'

import type { GenerateOpenApiDocumentInput, OpenApiDocument } from './types.js'

interface JsonSchema {
  [key: string]: unknown
}

const baseSchemaForField = (field: FieldMeta): JsonSchema => {
  if (field.kind === 'string') {
    return { type: 'string' }
  }

  if (field.kind === 'id' || field.kind === 'int') {
    return { type: 'integer' }
  }

  if (field.kind === 'boolean') {
    return { type: 'boolean' }
  }

  if (field.kind === 'datetime') {
    return { type: 'string', format: 'date-time' }
  }

  return { type: 'string' }
}

const applyValidation = (schema: JsonSchema, field: FieldMeta): JsonSchema => {
  const output = { ...schema }

  for (const rule of field.validations) {
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

const withNullable = (schema: JsonSchema, field: FieldMeta): JsonSchema => {
  if (!field.nullable) {
    return schema
  }

  return {
    anyOf: [schema, { type: 'null' }],
  }
}

const toComponentName = (resourceName: string, kind: 'Create' | 'Update' | 'Response' | 'IdParams'): string =>
  `${resourceName}${kind}`

const ref = (name: string): JsonSchema => ({
  $ref: `#/components/schemas/${name}`,
})

const isApiField = (field: FieldMeta): boolean => !field.hidden && !field.internal

const buildProperties = (resource: ResourceMeta): Record<string, JsonSchema> => {
  const properties: Record<string, JsonSchema> = {}

  for (const [fieldName, field] of Object.entries(resource.fields)) {
    const base = baseSchemaForField(field)
    const constrained = applyValidation(base, field)
    properties[fieldName] = withNullable(constrained, field)
  }

  return properties
}

const buildResourceSchemas = (resource: ResourceMeta): Record<string, JsonSchema> => {
  const properties = buildProperties(resource)
  const apiFields = Object.entries(resource.fields).filter(([, field]) => isApiField(field))

  const createProperties: Record<string, JsonSchema> = {}
  const createRequired: string[] = []

  for (const [fieldName, field] of apiFields) {
    createProperties[fieldName] = properties[fieldName]!

    if (!field.optional && !field.autoIncrement && field.defaultValue === undefined) {
      createRequired.push(fieldName)
    }
  }

  const updateProperties: Record<string, JsonSchema> = {}

  for (const [fieldName, field] of apiFields) {
    if (field.updatable) {
      updateProperties[fieldName] = properties[fieldName]!
    }
  }

  const responseProperties: Record<string, JsonSchema> = {}
  const responseRequired: string[] = []

  for (const [fieldName] of apiFields) {
    responseProperties[fieldName] = properties[fieldName]!
    responseRequired.push(fieldName)
  }

  const primaryField = Object.entries(resource.fields).find(([, field]) => field.primary)?.[0] ?? 'id'
  const primary = resource.fields[primaryField]
  const idType = primary?.kind === 'string' ? 'string' : 'integer'

  return {
    [toComponentName(resource.name, 'Create')]: {
      type: 'object',
      additionalProperties: false,
      required: createRequired,
      properties: createProperties,
    },
    [toComponentName(resource.name, 'Update')]: {
      type: 'object',
      additionalProperties: false,
      properties: updateProperties,
    },
    [toComponentName(resource.name, 'Response')]: {
      type: 'object',
      additionalProperties: false,
      required: responseRequired,
      properties: responseProperties,
    },
    [toComponentName(resource.name, 'IdParams')]: {
      type: 'object',
      additionalProperties: false,
      required: [primaryField],
      properties: {
        [primaryField]: { type: idType },
      },
    },
  }
}

const buildResourcePaths = (resource: ResourceMeta): Record<string, unknown> => {
  const createSchema = toComponentName(resource.name, 'Create')
  const updateSchema = toComponentName(resource.name, 'Update')
  const responseSchema = toComponentName(resource.name, 'Response')
  const idParamsSchema = toComponentName(resource.name, 'IdParams')
  const primaryField = Object.entries(resource.fields).find(([, field]) => field.primary)?.[0] ?? 'id'
  const primary = resource.fields[primaryField]
  const idType = primary?.kind === 'string' ? 'string' : 'integer'

  const collectionPath = `/${resource.table}`
  const byIdPath = `/${resource.table}/{${primaryField}}`

  return {
    [collectionPath]: {
      get: {
        operationId: `${resource.name}FindMany`,
        tags: [resource.name],
        responses: {
          '200': {
            description: `${resource.name} collection`,
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: ref(responseSchema),
                },
              },
            },
          },
        },
      },
      post: {
        operationId: `${resource.name}Create`,
        tags: [resource.name],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref(createSchema),
            },
          },
        },
        responses: {
          '201': {
            description: `${resource.name} created`,
            content: {
              'application/json': {
                schema: ref(responseSchema),
              },
            },
          },
        },
      },
    },
    [byIdPath]: {
      get: {
        operationId: `${resource.name}FindById`,
        tags: [resource.name],
        parameters: [
          {
            name: primaryField,
            in: 'path',
            required: true,
            schema: { type: idType },
          },
        ],
        responses: {
          '200': {
            description: `${resource.name} record`,
            content: {
              'application/json': {
                schema: ref(responseSchema),
              },
            },
          },
        },
      },
      patch: {
        operationId: `${resource.name}UpdateById`,
        tags: [resource.name],
        parameters: [
          {
            name: primaryField,
            in: 'path',
            required: true,
            schema: { type: idType },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: ref(updateSchema),
            },
          },
        },
        responses: {
          '200': {
            description: `${resource.name} updated`,
            content: {
              'application/json': {
                schema: ref(responseSchema),
              },
            },
          },
        },
      },
    },
  }
}

export const generateOpenApiDocument = ({
  resources,
  info,
}: GenerateOpenApiDocumentInput): OpenApiDocument => {
  const schemas: Record<string, unknown> = {}
  const paths: Record<string, unknown> = {}

  for (const resource of resources) {
    Object.assign(schemas, buildResourceSchemas(resource))
    Object.assign(paths, buildResourcePaths(resource))
  }

  return {
    openapi: '3.1.0',
    info,
    paths,
    components: {
      schemas,
    },
  }
}
