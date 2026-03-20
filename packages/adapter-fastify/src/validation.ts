import {
  getResourceMeta,
  type InferInsert,
  type InferUpdate,
  type ResourceDefinition,
  type ResourceFields,
} from '@define/core'

import { ValidationError } from './errors.js'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const validatePrimitive = (fieldName: string, kind: string, value: unknown, issues: string[]): void => {
  if (kind === 'string' && typeof value !== 'string') {
    issues.push(`Field ${fieldName} must be a string`)
    return
  }

  if ((kind === 'int' || kind === 'id') && (!Number.isInteger(value) || typeof value !== 'number')) {
    issues.push(`Field ${fieldName} must be an integer`)
    return
  }

  if (kind === 'boolean' && typeof value !== 'boolean') {
    issues.push(`Field ${fieldName} must be a boolean`)
    return
  }

  if (kind === 'datetime') {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return
    }

    if (typeof value === 'string' && !Number.isNaN(new Date(value).getTime())) {
      return
    }

    issues.push(`Field ${fieldName} must be a valid Date or ISO datetime string`)
  }
}

const validateConstraints = (
  fieldName: string,
  value: unknown,
  validations: Array<{ kind: string; value?: number }>,
  issues: string[],
): void => {
  for (const rule of validations) {
    if (rule.kind === 'email' && typeof value === 'string' && !EMAIL_REGEX.test(value)) {
      issues.push(`Field ${fieldName} must be a valid email`)
    }

    if (rule.kind === 'min') {
      if (typeof value === 'string' && typeof rule.value === 'number' && value.length < rule.value) {
        issues.push(`Field ${fieldName} must have minimum length ${rule.value}`)
      }

      if (typeof value === 'number' && typeof rule.value === 'number' && value < rule.value) {
        issues.push(`Field ${fieldName} must be >= ${rule.value}`)
      }
    }

    if (rule.kind === 'max') {
      if (typeof value === 'string' && typeof rule.value === 'number' && value.length > rule.value) {
        issues.push(`Field ${fieldName} must have maximum length ${rule.value}`)
      }

      if (typeof value === 'number' && typeof rule.value === 'number' && value > rule.value) {
        issues.push(`Field ${fieldName} must be <= ${rule.value}`)
      }
    }
  }
}

const normalizeDatetime = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return new Date(value)
  }

  return value
}

const validateInput = <
  TResource extends ResourceDefinition<string, string, ResourceFields>,
>(
  resource: TResource,
  value: unknown,
  mode: 'create' | 'update',
): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new ValidationError('Payload must be an object', ['Payload must be an object'])
  }

  const meta = getResourceMeta(resource)
  const issues: string[] = []
  const output: Record<string, unknown> = {}
  const fieldEntries = Object.entries(meta.fields).filter(([, field]) => !field.hidden && !field.internal)
  const fieldMap = new Set(fieldEntries.map(([name]) => name))

  for (const key of Object.keys(value)) {
    if (!fieldMap.has(key)) {
      issues.push(`Unknown field ${key}`)
    }
  }

  for (const [fieldName, field] of fieldEntries) {
    if (mode === 'update' && !field.updatable) {
      if (fieldName in value) {
        issues.push(`Field ${fieldName} is not updatable`)
      }
      continue
    }

    const hasValue = fieldName in value
    const raw = value[fieldName]

    if (!hasValue) {
      if (
        mode === 'create' &&
        !field.optional &&
        !field.autoIncrement &&
        field.defaultValue === undefined
      ) {
        issues.push(`Field ${fieldName} is required`)
      }
      continue
    }

    if (raw === null) {
      if (!field.nullable) {
        issues.push(`Field ${fieldName} cannot be null`)
      } else {
        output[fieldName] = null
      }
      continue
    }

    if (raw === undefined) {
      issues.push(`Field ${fieldName} cannot be undefined`)
      continue
    }

    validatePrimitive(fieldName, field.kind, raw, issues)
    validateConstraints(fieldName, raw, field.validations, issues)

    output[fieldName] = field.kind === 'datetime' ? normalizeDatetime(raw) : raw
  }

  if (issues.length > 0) {
    throw new ValidationError('Validation failed', issues)
  }

  return output
}

export const validateCreate = <
  TResource extends ResourceDefinition<string, string, ResourceFields>,
>(
  resource: TResource,
  value: unknown,
): InferInsert<TResource> => validateInput(resource, value, 'create') as InferInsert<TResource>

export const validateUpdate = <
  TResource extends ResourceDefinition<string, string, ResourceFields>,
>(
  resource: TResource,
  value: unknown,
): InferUpdate<TResource> => validateInput(resource, value, 'update') as InferUpdate<TResource>
