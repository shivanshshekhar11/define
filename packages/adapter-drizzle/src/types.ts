import type { ResourceMeta } from '@define/core'

export interface GenerateDrizzleSchemaInput {
  resources: ResourceMeta[]
}

export interface GenerateDrizzleSchemaResult {
  code: string
}

export type ColumnBuilderName =
  | 'text'
  | 'integer'
  | 'serial'
  | 'timestamp'
  | 'boolean'
