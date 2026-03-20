import Fastify from 'fastify'

import { createCRUDMethods } from '@define/adapter-fastify'

import { UserRepo } from '../.tool/generated/user.repo.js'
import { User } from './resources/user.js'

const start = async (): Promise<void> => {
  const app = Fastify({ logger: true })

  const errorSchema = {
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

  const { primaryField, schemas, methods } = createCRUDMethods({
    resource: User,
    repository: UserRepo,
  })

  app.post('/users', {
    schema: {
      body: schemas.createBodyJsonSchema,
      response: {
        201: schemas.responseJsonSchema,
        400: errorSchema,
      },
    },
  }, async (request, reply) => {
    const result = await methods.create(request.body)
    return reply.code(result.statusCode as 201 | 400).send(result.body)
  })

  app.get('/users', {
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

  app.get(`/users/:${primaryField}`, {
    schema: {
      params: schemas.idParamJsonSchema,
      response: {
        200: schemas.responseJsonSchema,
        400: errorSchema,
        404: errorSchema,
      },
    },
  }, async (request, reply) => {
    const result = await methods.findById(request.params as Record<string, unknown>)
    return reply.code(result.statusCode as 200 | 400 | 404).send(result.body)
  })

  app.patch(`/users/:${primaryField}`, {
    schema: {
      params: schemas.idParamJsonSchema,
      body: schemas.updateBodyJsonSchema,
      response: {
        200: schemas.responseJsonSchema,
        400: errorSchema,
        404: errorSchema,
      },
    },
  }, async (request, reply) => {
    const result = await methods.updateById(
      request.params as Record<string, unknown>,
      request.body,
    )
    return reply.code(result.statusCode as 200 | 400 | 404).send(result.body)
  })

  await app.listen({
    port: 3000,
    host: '0.0.0.0',
  })
}

start().catch((error) => {
  console.error(error)
  process.exit(1)
})
