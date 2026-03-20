import type { ResourceMeta } from '@define/core'

export interface OpenApiInfo {
  title: string
  version: string
}

export interface GenerateOpenApiDocumentInput {
  resources: ResourceMeta[]
  info: OpenApiInfo
}

export interface OpenApiDocument {
  openapi: '3.1.0'
  info: OpenApiInfo
  paths: Record<string, unknown>
  components: {
    schemas: Record<string, unknown>
  }
}
