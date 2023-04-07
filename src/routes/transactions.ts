import crypto from 'node:crypto'
import { z } from 'zod'
import { FastifyInstance } from 'fastify'
import { knex } from '../database'

export async function transactionRoutes(app: FastifyInstance) {
  app.post('/', async (request, reply) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['income', 'outcome']),
    })

    const body = createTransactionBodySchema.parse(request.body)

    const { title, amount, type } = body

    await knex('transactions').insert({
      id: crypto.randomUUID(),
      title,
      amount: type === 'income' ? amount : amount * -1,
    })

    reply.status(201).send()
  })
}
