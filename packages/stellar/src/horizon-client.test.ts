import { Keypair } from '@stellar/stellar-sdk'
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
})
