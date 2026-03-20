import type { FieldBuilder, FieldFlags } from './fields.js'
import type { FieldKind, FieldMeta, RelationMeta, ResourceMeta } from './meta.js'

type InferFieldValue<TField extends FieldBuilder<unknown, FieldKind, FieldFlags>> =
  TField['__fieldBrand']['value']

type InferFlags<TField extends FieldBuilder<unknown, FieldKind, FieldFlags>> =
  TField['__fieldBrand']['flags']

type Expand<T> = T extends infer O ? { [K in keyof O]: O[K] } : never

type MergeNullability<TValue, TField extends FieldBuilder<unknown, FieldKind, FieldFlags>> =
  InferFlags<TField>['nullable'] extends true ? TValue | null : TValue

type OptionalInsertKeys<TFields extends Record<string, FieldBuilder<unknown, FieldKind, FieldFlags>>> = {
  [K in keyof TFields]: InferFlags<TFields[K]>['optional'] extends true
    ? K
    : InferFlags<TFields[K]>['autoIncrement'] extends true
      ? K
      : InferFlags<TFields[K]>['hasDefault'] extends true
        ? K
        : never
}[keyof TFields]

type RequiredInsertKeys<TFields extends Record<string, FieldBuilder<unknown, FieldKind, FieldFlags>>> =
  Exclude<keyof TFields, OptionalInsertKeys<TFields>>

type UpdatableKeys<TFields extends Record<string, FieldBuilder<unknown, FieldKind, FieldFlags>>> = {
  [K in keyof TFields]: InferFlags<TFields[K]>['updatable'] extends true ? K : never
}[keyof TFields]

export type InferRow<TResource extends ResourceDefinition<string, string, Record<string, FieldBuilder<unknown, FieldKind, FieldFlags>>>> =
  Expand<{
    [K in keyof TResource['fields']]: MergeNullability<
      InferFieldValue<TResource['fields'][K]>,
      TResource['fields'][K]
    >
  }>

export type InferInsert<TResource extends ResourceDefinition<string, string, Record<string, FieldBuilder<unknown, FieldKind, FieldFlags>>>> =
  Expand<
    {
      [K in RequiredInsertKeys<TResource['fields']>]: MergeNullability<
        InferFieldValue<TResource['fields'][K]>,
        TResource['fields'][K]
      >
    } & {
      [K in OptionalInsertKeys<TResource['fields']>]?: MergeNullability<
        InferFieldValue<TResource['fields'][K]>,
        TResource['fields'][K]
      >
    }
  >

export type InferUpdate<TResource extends ResourceDefinition<string, string, Record<string, FieldBuilder<unknown, FieldKind, FieldFlags>>>> =
  Expand<
    Partial<{
      [K in UpdatableKeys<TResource['fields']>]: MergeNullability<
        InferFieldValue<TResource['fields'][K]>,
        TResource['fields'][K]
      >
    }>
  >

export type ResourceFields = Record<string, FieldBuilder<unknown, FieldKind, FieldFlags>>

export interface ResourceDefinition<
  TName extends string,
  TTable extends string,
  TFields extends ResourceFields,
> {
  readonly name: TName
  readonly table: TTable
  readonly fields: TFields
  readonly relations: RelationMeta[]
  readonly __meta: ResourceMeta
}

interface ResourceConfig<TTable extends string, TFields extends ResourceFields> {
  table: TTable
  fields: TFields
  relations?: RelationMeta[]
}

const buildFieldMeta = (fields: ResourceFields): Record<string, FieldMeta> => {
  const output: Record<string, FieldMeta> = {}

  for (const [key, field] of Object.entries(fields)) {
    output[key] = field.getMeta()
  }

  return output
}

export const resource = <
  TName extends string,
  TTable extends string,
  TFields extends ResourceFields,
>(
  name: TName,
  config: ResourceConfig<TTable, TFields>,
): ResourceDefinition<TName, TTable, TFields> => {
  const relations = config.relations ?? []

  return {
    name,
    table: config.table,
    fields: config.fields,
    relations,
    __meta: {
      name,
      table: config.table,
      fields: buildFieldMeta(config.fields),
      relations,
    },
  }
}

export const getResourceMeta = (
  resourceDef: ResourceDefinition<string, string, ResourceFields>,
): ResourceMeta => resourceDef.__meta
