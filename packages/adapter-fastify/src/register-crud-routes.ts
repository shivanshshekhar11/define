import { getResourceMeta, type ResourceDefinition, type ResourceFields } from '@define-js/core'
import type { FastifyInstance } from 'fastify'

import { createCRUDMethods, type CrudRepository } from './crud-methods.js'

export interface RegisterCrudRoutesOptions<
  TResource extends ResourceDefinition<string, string, ResourceFields>,
  TRow,
  TInsert,
  TUpdate,
> {
  fastify: FastifyInstance
  resource: TResource
  repository: CrudRepository<TRow, TInsert, TUpdate>
  basePath?: string
}

export const registerCRUDRoutes = async <
  TResource extends ResourceDefinition<string, string, ResourceFields>,
  TRow,
  TInsert,
  TUpdate,
>({
  fastify,
  resource,
  repository,
  basePath,
}: RegisterCrudRoutesOptions<TResource, TRow, TInsert, TUpdate>): Promise<void> => {
  const meta = getResourceMeta(resource)
  const { primaryField, schemas, methods } = createCRUDMethods({
    resource,
    repository,
  })
  const resolvedBasePath = basePath ?? `/${meta.table}`
  const validationErrorSchema = {
    type: 'object',
    additionalProperties: true,
    required: ['message'],
    properties: {
      message: { type: 'string' },
      issues: {
        type: 'array',
        items: { type: 'string' },
      },
      statusCode: { type: 'integer' },
      error: { type: 'string' },
    },
  }
  const notFoundSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['message'],
    properties: {
      message: { type: 'string' },
    },
  }
  const invalidParamSchema = {
    type: 'object',
    additionalProperties: false,
    required: ['message'],
    properties: {
      message: { type: 'string' },
    },
  }

  fastify.post(resolvedBasePath, {
    schema: {
      body: schemas.createBodyJsonSchema,
      response: {
        201: schemas.responseJsonSchema,
        400: validationErrorSchema,
      },
    },
  }, async (request, reply) => {
    const result = await methods.create(request.body)
    return reply.code(result.statusCode as 201 | 400).send(result.body)
  })

  fastify.get(resolvedBasePath, {
    schema: {
      response: {
        200: {
          type: 'array',
          items: schemas.responseJsonSchema,
        },
      },
    },
  }, async (_request, reply) => {
    const result = await methods.findMany()
    return reply.code(result.statusCode as 200).send(result.body)
  })

  fastify.get(`${resolvedBasePath}/:${primaryField}`, {
    schema: {
      params: schemas.idParamJsonSchema,
      response: {
        200: schemas.responseJsonSchema,
        400: invalidParamSchema,
        404: notFoundSchema,
      },
    },
  }, async (request, reply) => {
    const result = await methods.findById(request.params as Record<string, unknown>)
    return reply.code(result.statusCode as 200 | 400 | 404).send(result.body)
  })

  fastify.patch(`${resolvedBasePath}/:${primaryField}`, {
    schema: {
      params: schemas.idParamJsonSchema,
      body: schemas.updateBodyJsonSchema,
      response: {
        200: schemas.responseJsonSchema,
        400: validationErrorSchema,
        404: notFoundSchema,
      },
    },
  }, async (request, reply) => {
    const result = await methods.updateById(
      request.params as Record<string, unknown>,
      request.body,
    )
    return reply.code(result.statusCode as 200 | 400 | 404).send(result.body)
  })
}
