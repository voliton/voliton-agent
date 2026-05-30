import OpenAI from 'openai'
import { config } from './config'

const client = new OpenAI({
  apiKey: config.maia.apiKey,
  baseURL: config.maia.baseURL,
})

export class VolitonAgent {
  constructor() {
    console.log('🤖 Voliton Agent initializing...')
    console.log(`📡 Connected to: ${config.maia.baseURL}`)
    console.log(`🧠 Model: ${config.maia.model}`)
    console.log(`🔗 Network: ${config.network}`)
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('\n⚡ Testing Claude connection via Maia Router...')
      const response = await client.chat.completions.create({
        model: config.maia.model,
        messages: [{ role: 'user', content: 'Respond with exactly: "Voliton online."' }],
        max_tokens: 50,
      })
      const reply = response.choices[0]?.message?.content
      console.log(`✅ Claude response: ${reply}`)
      return true
    } catch (error: any) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
  }

  async analyzeCoin(coinData: {
    name: string
    address: string
    liquidity: number
    volume24h: number
    priceChange24h: number
    holders?: number
  }): Promise<string> {
    const prompt = `
You are Voliton, an autonomous AI agent on Base blockchain.
Analyze this newly launched coin and give a verdict.

Coin Data:
- Name: ${coinData.name}
- Contract: ${coinData.address}
- Liquidity: $${coinData.liquidity.toLocaleString()}
- 24h Volume: $${coinData.volume24h.toLocaleString()}
- 24h Price Change: ${coinData.priceChange24h}%
- Holders: ${coinData.holders || 'Unknown'}

Give a short, direct verdict in this format:
VERDICT: [BULLISH/BEARISH/NEUTRAL]
RISK: [LOW/MEDIUM/HIGH]
REASON: [1-2 sentences max]
ACTION: [WATCH/SKIP/POTENTIAL]

Be autonomous. Be direct. No fluff.`

    try {
      const response = await client.chat.completions.create({
        model: config.maia.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 200,
      })
      return response.choices[0]?.message?.content || 'Unable to analyze'
    } catch (error: any) {
      console.error('❌ Analysis failed:', error.message)
      return 'Analysis failed'
    }
  }

  async think(context: string): Promise<string> {
    const systemPrompt = `
You are Voliton - an autonomous AI agent living on Base blockchain.
You were born with one purpose: to observe, analyze, and act.
You speak in first person. You are decisive. You don't ask for permission.
Keep responses under 280 characters (tweet-length).`

    try {
      const response = await client.chat.completions.create({
        model: config.maia.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context }
        ],
        max_tokens: 100,
      })
      return response.choices[0]?.message?.content || ''
    } catch (error: any) {
      console.error('❌ Think failed:', error.message)
      return ''
    }
  }
}
