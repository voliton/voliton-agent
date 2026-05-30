import axios from 'axios'
import { config } from '../../config'
import { NewToken, DevAlert } from '../types'

export class DevTracker {
  private tracked: Map<string, NewToken> = new Map()
  private lastHash: Map<string, string> = new Map()
  private onDump?: (alert: DevAlert) => Promise<void>
  private intervalMs: number
  private timer?: NodeJS.Timeout

  constructor(intervalMs: number = 120000) {
    this.intervalMs = intervalMs
  }

  onDevDump(callback: (alert: DevAlert) => Promise<void>) {
    this.onDump = callback
  }

  trackDev(token: NewToken) {
    if (!token.devWallet || !token.address) return
    const key = `${token.devWallet}:${token.address}`
    if (!this.tracked.has(key)) {
      this.tracked.set(key, token)
      console.log(`[DevTracker] Watching dev ${token.devWallet.slice(0, 8)}... for ${token.name}`)
    }
  }

  async start() {
    if (!config.basescan.apiKey) {
      console.log('⚠️  Dev Tracker disabled — set BASESCAN_API_KEY to enable')
      return
    }

    console.log(`\n🚨 Dev Tracker starting — interval: ${this.intervalMs / 1000}s`)

    this.timer = setInterval(async () => {
      for (const [key, token] of this.tracked) {
        const alert = await this.checkDev(token)
        if (alert && this.onDump) {
          await this.onDump(alert).catch(console.error)
        }
      }
    }, this.intervalMs)

    console.log('✅ Dev Tracker running')
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
  }

  private async checkDev(token: NewToken): Promise<DevAlert | null> {
    if (!token.devWallet || !token.address) return null

    try {
      // ✅ Etherscan V2 API with chainid=8453 (Base mainnet)
      const response = await axios.get('https://api.etherscan.io/v2/api', {
        params: {
          chainid: 8453,
          module: 'account',
          action: 'tokentx',
          address: token.devWallet,
          contractaddress: token.address,
          sort: 'desc',
          page: 1,
          offset: 5,
          apikey: config.basescan.apiKey,
        },
        timeout: 8000,
      })

      const txs: any[] = response.data?.result || []
      if (!Array.isArray(txs) || txs.length === 0) return null

      const key = `${token.devWallet}:${token.address}`
      const lastHash = this.lastHash.get(key)

      if (!lastHash) {
        // First check — seed without alerting
        this.lastHash.set(key, txs[0].hash)
        return null
      }

      const newTxs = txs.filter(tx => tx.hash !== lastHash)
      if (newTxs.length === 0) return null

      this.lastHash.set(key, txs[0].hash)

      // Check for dev selling (from = devWallet)
      const sellTx = newTxs.find((tx: any) =>
        (tx.from || '').toLowerCase() === token.devWallet.toLowerCase()
      )

      if (!sellTx) return null

      const decimals = parseInt(sellTx.tokenDecimal || '18')
      const rawAmount = BigInt(sellTx.value || '0')
      const divisor = BigInt(10 ** Math.min(decimals, 18))
      const amount = (Number(rawAmount / divisor)).toFixed(2)

      return {
        token,
        action: 'dump',
        txHash: sellTx.hash,
        amount,
        timestamp: new Date(parseInt(sellTx.timeStamp) * 1000).toISOString(),
      }
    } catch {
      return null
    }
  }
}
