import axios from 'axios'
import { BaseLaunchpadPlugin } from './base.plugin'
import { NewToken } from '../../types'

// Virtuals Protocol — AI agent token launchpad on Base
// API: https://api.virtuals.io (Strapi-based)
export class VirtualsPlugin extends BaseLaunchpadPlugin {
  name = 'Virtuals'
  private baseUrl = 'https://api.virtuals.io/api/virtuals'

  async fetch(): Promise<NewToken[]> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          'filters[status]': 1,          // Active agents only
          'sort[0]': 'createdAt:desc',
          'pagination[pageSize]': 10,
          'populate': 'socials,tokenInfo'
        },
        timeout: 10000,
        headers: { 'User-Agent': 'VolitonAgent/0.2' }
      })

      const items = response.data?.data || []
      if (!Array.isArray(items)) return []

      return items
        .filter((item: any) => {
          const attrs = item.attributes || item
          return attrs.tokenAddress || attrs.contractAddress
        })
        .map((item: any) => this.mapToken(item))
    } catch (err: any) {
      // Virtuals API may require auth or have different endpoint
      this.error('fetch failed — check Virtuals API availability', err)
      return []
    }
  }

  private mapToken(item: any): NewToken {
    const attrs = item.attributes || item

    // Handle different social data formats
    const socials = attrs.socials?.data || attrs.socials || []
    const findSocial = (type: string) =>
      socials.find((s: any) =>
        s.type === type || s.platform === type ||
        (s.url || '').includes(type === 'twitter' ? 'x.com' : type)
      )

    const twitter = findSocial('twitter') || findSocial('x')
    const telegram = findSocial('telegram')
    const website = findSocial('website')

    const address = attrs.tokenAddress || attrs.contractAddress || ''

    return {
      name: attrs.name || attrs.agentName || 'Unknown',
      symbol: attrs.symbol || attrs.ticker || '???',
      address: address.toLowerCase(),
      launchpad: 'Virtuals',
      deployedAt: attrs.createdAt || new Date().toISOString(),
      devWallet: (attrs.creatorAddress || attrs.deployer || '').toLowerCase(),
      twitterUrl: twitter?.url || attrs.twitterUrl,
      telegramUrl: telegram?.url || attrs.telegramUrl,
      websiteUrl: website?.url || attrs.websiteUrl,
      dexUrl: address ? `https://dexscreener.com/base/${address}` : undefined,
    }
  }
}
