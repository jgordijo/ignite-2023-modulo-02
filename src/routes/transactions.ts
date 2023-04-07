import crypto from 'node:crypto'
import { z } from 'zod'
import { FastifyInstance } from 'fastify'
import { knex } from '../database'

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const transactions = await knex('transactions').select()

    return { transactions }
  })

  app.get('/:id', async (request) => {
    const getTransactionsParamsSchema = z.object({
      id: z.string().uuid(),
    })

    const { id } = getTransactionsParamsSchema.parse(request.params)

    const transaction = await knex('transactions').where('id', id).first()

    return { transaction }
  })

  app.get('/balance', async () => {
    const balance = await knex('transactions').sum('amount as total').first()

    return { balance }
  })

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
