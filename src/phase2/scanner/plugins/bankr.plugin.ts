import axios from 'axios'
import { ClankerPlugin } from './clanker.plugin'
import { NewToken } from '../../types'

// Bankr tokens are deployed via Clanker infrastructure
// Filter by socialInterface=Bankr to get only Bankr-launched tokens
export class BankrPlugin extends ClankerPlugin {
  name = 'Bankr'
  protected launchpadLabel = 'Bankr'
  private bankrUrl = 'https://www.clanker.world/api/tokens'

  async fetch(): Promise<NewToken[]> {
    try {
      const response = await axios.get(this.bankrUrl, {
        params: {
          sort: 'desc',
          sortBy: 'deployed-at',
          includeMarket: true,
          includeUser: false,
          chainId: 8453,
          limit: 20,
          socialInterface: 'Bankr',  // Filter Bankr-only tokens
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
}
