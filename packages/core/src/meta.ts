export type FieldKind = 'string' | 'int' | 'datetime' | 'id' | 'boolean'

export type ValidationKind = 'email' | 'min' | 'max'

export interface ValidationConstraint {
  kind: ValidationKind
  value?: number
}

export interface FieldMeta {
  kind: FieldKind
  nullable: boolean
  optional: boolean
  unique: boolean
  primary: boolean
  defaultValue?: unknown
  autoIncrement: boolean
  updatable: boolean
  hidden: boolean
  internal: boolean
  validations: ValidationConstraint[]
}

export interface RelationMeta {
  name: string
  kind: 'hasOne' | 'hasMany' | 'belongsTo'
  resource: string
  field: string
  references: string
}

export interface ResourceMeta {
  name: string
  table: string
  fields: Record<string, FieldMeta>
  relations: RelationMeta[]
}
