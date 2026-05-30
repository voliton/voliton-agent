import axios from 'axios'

export interface DexData {
  priceUsd?: string
  liquidity?: number
  volume24h?: number
  priceChange24h?: number
  txns24h?: { buys: number; sells: number }
  dexUrl?: string
  pairAddress?: string
}

// DexScreener public API — free, no API key needed
export async function enrichFromDexScreener(tokenAddress: string): Promise<DexData> {
  if (!tokenAddress) return {}

  try {
    const response = await axios.get(
      `https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`,
      { timeout: 8000, headers: { 'User-Agent': 'VolitonAgent/0.2' } }
    )

    const pairs: any[] = response.data?.pairs || []
    if (pairs.length === 0) return {}

    // Pick pair with highest liquidity
    const best = pairs
      .filter((p: any) => p.chainId === 'base')
      .sort((a: any, b: any) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0]
      || pairs[0]

    return {
      priceUsd: best.priceUsd,
      liquidity: best.liquidity?.usd,
      volume24h: best.volume?.h24,
      priceChange24h: best.priceChange?.h24,
      txns24h: {
        buys: best.txns?.h24?.buys || 0,
        sells: best.txns?.h24?.sells || 0,
      },
      dexUrl: best.url,
      pairAddress: best.pairAddress,
    }
  } catch {
    return {}
  }
}
