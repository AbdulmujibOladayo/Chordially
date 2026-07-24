import { Account, Keypair, NetworkError } from '@stellar/stellar-sdk'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { HorizonStellarClient } from './horizon-client.js'

const config = {
  network: 'testnet' as const,
  horizonUrl: 'https://horizon-testnet.stellar.org',
  friendbotUrl: 'https://friendbot.stellar.org',
}

describe('HorizonStellarClient', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('generates a valid Stellar keypair without hitting the network', () => {
    const client = new HorizonStellarClient(config)
    const keypair = client.generateKeypair()

    expect(keypair.publicKey).toMatch(/^G[A-Z0-9]{55}$/)
    expect(keypair.secretKey).toMatch(/^S[A-Z0-9]{55}$/)
    expect(() => Keypair.fromSecret(keypair.secretKey)).not.toThrow()
  })

  it('reads the native XLM balance from the loaded account', async () => {
    const client = new HorizonStellarClient(config)
    const publicKey = Keypair.random().publicKey()

    vi.spyOn(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (client as any).server,
      'loadAccount'
    ).mockResolvedValue({
      accountId: () => publicKey,
      sequence: '1',
      balances: [
        { asset_type: 'native', balance: '10000.0000000' },
        { asset_type: 'credit_alphanum4', asset_code: 'USDC', balance: '5.0000000' },
      ],
    })

    const balance = await client.getNativeBalance({ publicKey })
    expect(balance).toBe('10000.0000000')
  })

  it('rejects funding a non-testnet client', async () => {
    const client = new HorizonStellarClient({ ...config, network: 'public' })
    await expect(client.fundTestnetAccount({ publicKey: 'GABC' })).rejects.toThrow(
      'testnet'
    )
  })

  it('calls friendbot with the account public key', async () => {
    const client = new HorizonStellarClient(config)
    const fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)

    await client.fundTestnetAccount({ publicKey: 'GABC' })

    expect(fetchMock).toHaveBeenCalledWith(
      'https://friendbot.stellar.org?addr=GABC'
    )
  })

  it('builds, signs, and submits a native payment', async () => {
    const client = new HorizonStellarClient(config)
    const source = Keypair.random()
    const destination = Keypair.random().publicKey()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn((client as any).server, 'loadAccount').mockResolvedValue(
      new Account(source.publicKey(), '1')
    )
    const submitSpy = vi
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn((client as any).server, 'submitTransaction')
      .mockResolvedValue({ hash: 'abc123', ledger: 42, successful: true })

    const result = await client.submitPayment({
      sourceSecretKey: source.secret(),
      destinationPublicKey: destination,
      amount: '25',
    })

    expect(result).toEqual({ hash: 'abc123', ledger: 42, successful: true })
    expect(submitSpy).toHaveBeenCalledTimes(1)
  })

  it('builds one operation per payee for a split payment', async () => {
    const client = new HorizonStellarClient(config)
    const source = Keypair.random()
    const payeeA = Keypair.random().publicKey()
    const payeeB = Keypair.random().publicKey()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vi.spyOn((client as any).server, 'loadAccount').mockResolvedValue(
      new Account(source.publicKey(), '1')
    )
    const submitSpy = vi
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .spyOn((client as any).server, 'submitTransaction')
      .mockImplementation((tx: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect((tx as any).operations).toHaveLength(2)
        return Promise.resolve({ hash: 'split-hash', ledger: 99, successful: true })
      })

    const result = await client.submitSplitPayment({
      sourceSecretKey: source.secret(),
      payments: [
        { destinationPublicKey: payeeA, amount: '5' },
        { destinationPublicKey: payeeB, amount: '3' },
      ],
    })

    expect(result).toEqual({ hash: 'split-hash', ledger: 99, successful: true })
    expect(submitSpy).toHaveBeenCalledTimes(1)
  })

  it('rejects a split payment with no payees', async () => {
    const client = new HorizonStellarClient(config)
    const source = Keypair.random()

    await expect(
      client.submitSplitPayment({ sourceSecretKey: source.secret(), payments: [] })
    ).rejects.toThrow('at least one payment')
  })

  describe('isTransientSubmissionError', () => {
    const client = new HorizonStellarClient(config)

    it('treats a stale sequence number as transient', () => {
      const error = new NetworkError('bad seq', {
        data: { extras: { result_codes: { transaction: 'tx_bad_seq' } } },
      })
      expect(client.isTransientSubmissionError(error)).toBe(true)
    })

    it('treats an insufficient balance failure as permanent', () => {
      const error = new NetworkError('failed', {
        data: { extras: { result_codes: { transaction: 'tx_failed' } } },
      })
      expect(client.isTransientSubmissionError(error)).toBe(false)
    })

    it('treats a network error with no result code as transient', () => {
      const error = new NetworkError('timeout', {})
      expect(client.isTransientSubmissionError(error)).toBe(true)
    })

    it('treats a plain error as permanent', () => {
      expect(client.isTransientSubmissionError(new Error('boom'))).toBe(false)
    })
  })
})
