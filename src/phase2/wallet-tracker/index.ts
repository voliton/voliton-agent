import axios from 'axios'
import { config } from '../../config'
import { WalletEntry } from '../types'
import { getAllWallets } from './storage'

export interface WalletTx {
  hash: string
  from: string
  to: string
  value: string
  timeStamp: string
  tokenName?: string
  tokenSymbol?: string
  tokenDecimal?: string
  contractAddress?: string
  direction: 'in' | 'out'
}

export class WalletTracker {
  private lastTxHash: Map<string, string> = new Map()
  private onActivity?: (wallet: WalletEntry, txs: WalletTx[]) => Promise<void>
  private intervalMs: number
  private timer?: NodeJS.Timeout

  constructor(intervalMs: number = 300000) {
    this.intervalMs = intervalMs
  }

  onWalletActivity(callback: (wallet: WalletEntry, txs: WalletTx[]) => Promise<void>) {
    this.onActivity = callback
  }

  async start() {
    if (!config.basescan.apiKey) {
      console.log('⚠️  Wallet Tracker disabled — set BASESCAN_API_KEY to enable')
      return
    }

    console.log(`\n👛 Wallet Tracker starting — interval: ${this.intervalMs / 1000}s`)

    // Seed: record current latest tx for each wallet (no alerts)
    const wallets = getAllWallets()
    for (const wallet of wallets) {
      await this.seedWallet(wallet)
    }
    console.log(`✅ Tracking ${wallets.length} wallet(s)`)

    this.timer = setInterval(async () => {
      const current = getAllWallets()
      for (const wallet of current) {
        // Seed any newly added wallets
        if (!this.lastTxHash.has(wallet.address)) {
          await this.seedWallet(wallet)
          continue
        }
        const newTxs = await this.getNewTxs(wallet)
        if (newTxs.length > 0 && this.onActivity) {
          await this.onActivity(wallet, newTxs).catch(console.error)
        }
      }
    }, this.intervalMs)

    console.log('✅ Wallet Tracker running')
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
  }

  private async seedWallet(wallet: WalletEntry): Promise<void> {
    try {
      const txs = await this.fetchTxs(wallet.address)
      if (txs.length > 0) {
        this.lastTxHash.set(wallet.address, txs[0].hash)
      } else {
        this.lastTxHash.set(wallet.address, '')
      }
    } catch {
      this.lastTxHash.set(wallet.address, '')
    }
  }

  private async getNewTxs(wallet: WalletEntry): Promise<WalletTx[]> {
    try {
      const txs = await this.fetchTxs(wallet.address)
      if (txs.length === 0) return []

      const lastHash = this.lastTxHash.get(wallet.address) || ''
      if (!lastHash) {
        this.lastTxHash.set(wallet.address, txs[0].hash)
        return []
      }

      const lastIndex = txs.findIndex(tx => tx.hash === lastHash)
      const newTxs = lastIndex > 0 ? txs.slice(0, lastIndex) : []

      if (txs.length > 0) {
        this.lastTxHash.set(wallet.address, txs[0].hash)
      }

      return newTxs
    } catch (err: any) {
      console.error(`[WalletTracker] Failed to check ${wallet.label}: ${err.message}`)
      return []
    }
  }

  // ✅ Updated: Etherscan V2 API with chainid=8453 (Base mainnet)
  private async fetchTxs(address: string): Promise<WalletTx[]> {
    const response = await axios.get('https://api.etherscan.io/v2/api', {
      params: {
        chainid: 8453,          // Base mainnet
        module: 'account',
        action: 'tokentx',      // ERC-20 token transfers
        address,
        sort: 'desc',
        page: 1,
        offset: 20,
        apikey: config.basescan.apiKey,
      },
      timeout: 8000,
    })

    const raw: any[] = response.data?.result || []
    if (!Array.isArray(raw)) return []

    return raw.map((tx: any): WalletTx => ({
      hash: tx.hash,
      from: (tx.from || '').toLowerCase(),
      to: (tx.to || '').toLowerCase(),
      value: tx.value || '0',
      timeStamp: tx.timeStamp,
      tokenName: tx.tokenName,
      tokenSymbol: tx.tokenSymbol,
      tokenDecimal: tx.tokenDecimal,
      contractAddress: tx.contractAddress,
      direction: (tx.from || '').toLowerCase() === address.toLowerCase() ? 'out' : 'in',
    }))
  }
}
