import axios from 'axios'
import { BaseLaunchpadPlugin } from './base.plugin'
import { NewToken } from '../../types'

export class ClankerPlugin extends BaseLaunchpadPlugin {
  name = 'Clanker'
  private baseUrl = 'https://www.clanker.world/api/tokens'
  protected launchpadLabel = 'Clanker'

  async fetch(): Promise<NewToken[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          sort: 'desc',
          sortBy: 'deployed-at',
          includeMarket: true,
          includeUser: false,
          chainId: 8453,
          limit: 20,
        },
        timeout: 10000,
        headers: { 'User-Agent': 'VolitonAgent/0.2' }
      })

      const tokens = response.data?.data || []
      if (!Array.isArray(tokens)) return []

      return tokens
        .filter((t: any) => t.contract_address)
        .map((t: any) => this.mapToken(t))
    } catch (err: any) {
      this.error('fetch failed', err)
      return []
    }
  }

  protected mapToken(t: any): NewToken {
    const socials: any[] = t.metadata?.socialMediaUrls || []
    const twitter = socials.find((s: any) => s.platform === 'twitter' || s.platform === 'x')
    const telegram = socials.find((s: any) => s.platform === 'telegram')
    const website = socials.find((s: any) => s.platform === 'website' || s.platform === 'web')
    const market = t.related?.market

    // Try to get image from multiple possible fields
    const imageUrl = t.img_url || t.image_url || t.metadata?.image || t.metadata?.imageUrl || undefined

    return {
      name: t.name || 'Unknown',
      symbol: t.symbol || '???',
      address: (t.contract_address || '').toLowerCase(),
      launchpad: this.launchpadLabel,
      deployedAt: t.deployed_at || t.created_at || new Date().toISOString(),
      devWallet: (t.msg_sender || '').toLowerCase(),
      twitterUrl: twitter?.url,
      telegramUrl: telegram?.url,
      websiteUrl: website?.url,
      marketCap: market?.market_cap,
      volume24h: market?.volume_24h,
      priceChange24h: market?.price_change_24h,
      dexUrl: `https://dexscreener.com/base/${t.contract_address}`,
      imageUrl,
    }
  }
}
