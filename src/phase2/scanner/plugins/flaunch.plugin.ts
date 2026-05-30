import axios from 'axios'
import { BaseLaunchpadPlugin } from './base.plugin'
import { NewToken } from '../../types'
import { config } from '../../../config'

// Flaunch V2 API — https://api-v2.flayerlabs.xyz
// Auth: X-Api-Key header (get key at builders.flaunch.gg)
// Without API key: uses public endpoint (may have lower rate limits)
export class FlaunchPlugin extends BaseLaunchpadPlugin {
  name = 'Flaunch'
  private baseUrl = 'https://api-v2.flayerlabs.xyz'
  private chain = 'base'

  async fetch(): Promise<NewToken[]> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'VolitonAgent/0.2',
      }

      // Add API key if configured
      if (config.flaunch?.apiKey) {
        headers['X-Api-Key'] = config.flaunch.apiKey
      }

      // Fetch newest coins sorted by createdAt
      const response = await axios.get(
        `${this.baseUrl}/v2/${this.chain}/coins/top`,
        {
          params: {
            sort: 'new',
            limit: 20,
          },
          headers,
          timeout: 10000,
        }
      )

      const coins: any[] = response.data?.data || []
      if (!Array.isArray(coins)) return []

      return coins
        .filter((c: any) => c.tokenAddress)
        .map((c: any) => this.mapToken(c))
    } catch (err: any) {
      // 401 = need API key
      if (err.response?.status === 401) {
        this.error('API key required — get one at builders.flaunch.gg, add FLAUNCH_API_KEY to .env')
      } else {
        this.error('fetch failed', err)
      }
      return []
    }
  }

  private mapToken(c: any): NewToken {
    const address = (c.tokenAddress || '').toLowerCase()

    // royaltyMembers[0] is the creator/dev wallet
    const devWallet = (c.royaltyMembers?.[0]?.address || '').toLowerCase()

    return {
      name: c.name || 'Unknown',
      symbol: c.symbol || '???',
      address,
      launchpad: 'Flaunch',
      deployedAt: new Date().toISOString(), // API doesn't return createdAt in top endpoint
      devWallet,
      imageUrl: c.image || undefined,
      marketCap: c.marketCapUSD ? parseFloat(c.marketCapUSD) : undefined,
      volume24h: c.twentyFourHourVolumeUSD ? parseFloat(c.twentyFourHourVolumeUSD) : undefined,
      priceChange24h: c.twentyFourHourChangePercentage ?? undefined,
      dexUrl: address ? `https://flaunch.gg/base/coin/${address}` : undefined,
    }
  }
}
