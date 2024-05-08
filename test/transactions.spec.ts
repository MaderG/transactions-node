import { test, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(async () => {
    execSync('npx knex migrate:rollback --all')
    execSync('npx knex migrate:latest')
  })

  test('The user can create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 100,
        type: 'credit',
      })
      .expect(201)
  })

  test('The user can get a list of all transactions', async () => {
    const createTransaction = await request(app.server)
      .post('/transactions')
      .send({
        title: 'New transaction',
        amount: 100,
        type: 'credit',
      })

    const sessionId = createTransaction.get('Set-Cookie')

    const listTransaction = await request(app.server)
      .get('/transactions')
      .set('Cookie', sessionId)
      .expect(200)

    expect(listTransaction.body.transactions).toEqual([
      expect.objectContaining({
        title: 'New transaction',
        amount: 100,
      }),
    ])
  })

  test('The user can get a list of a specific transaction', async () => {
    const createTransaction = await request(app.server)
      .post('/transactions')
      .send({
        title: 'Another transaction',
        amount: 180,
        type: 'debit',
      })

    const sessionId = createTransaction.get('Set-Cookie')

    const listTransaction = await request(app.server)
      .get('/transactions/')
      .set('Cookie', sessionId)
      .expect(200)

    const transactionId = listTransaction.body.transactions[0].id

    const specificTransaction = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', sessionId)
      .expect(200)

    expect(specificTransaction.body.transaction).toEqual(
      expect.objectContaining({
        title: 'Another transaction',
        amount: -180,
      }),
    )
  })

  test('The user can get a summary of all transactions', async () => {
    const firstTransaction = await request(app.server)
      .post('/transactions')
      .send({
        title: 'First transaction',
        amount: 180,
        type: 'debit',
      })

    const sessionId = firstTransaction.get('Set-Cookie')

    // Second transaction
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'Second transaction',
        amount: 200,
        type: 'credit',
      })
      .set('Cookie', sessionId)

    const summaryTransactions = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', sessionId)
      .expect(200)

    expect(summaryTransactions.body.summary).toEqual(
      expect.objectContaining({
        amount: 20,
      }),
    )
  })
})
