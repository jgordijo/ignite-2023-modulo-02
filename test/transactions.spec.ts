import { execSync } from 'node:child_process'
import { expect, it, beforeAll, afterAll, describe, beforeEach } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to create a transaction', async () => {
    const response = await request(app.server).post('/transactions').send({
      title: 'New transaction',
      amount: 1000,
      type: 'income',
    })

    expect(response.status).toBe(201)
  })

  it('should be able to list all transactions', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 1000,
        type: 'income',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)

    expect(listTransactionsResponse.status).toBe(200)
    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 1000,
      }),
    ])
  })

  it('should be able get a specific transaction', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 1000,
        type: 'income',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)
      .expect(200)

    expect(getTransactionResponse.body.transaction).toEqual(
      expect.objectContaining({
        title: 'New transaction',
        amount: 1000,
      }),
    )
  })

  it('should be able to get the balance', async () => {
    const createTransactionResponse = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 1000,
        type: 'income',
      })

    const cookies = createTransactionResponse.get('Set-Cookie')

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Another income transaction',
        amount: 2000,
        type: 'income',
      })

    await request(app.server)
      .post('/transactions')
      .set('Cookie', cookies)
      .send({
        title: 'Outcome transaction',
        amount: 1500,
        type: 'outcome',
      })

    const getBalanceResponse = await request(app.server)
      .get('/transactions/balance')
      .set('Cookie', cookies)

    expect(getBalanceResponse.status).toBe(200)
    expect(getBalanceResponse.body.balance).toEqual({
      total: 1500,
    })
  })
})
