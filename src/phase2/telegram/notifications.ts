import { NewToken, WalletEntry, IdentityResult, DevAlert } from '../types'
import { WalletTx } from '../wallet-tracker'

// ============================================================
// FORMAT: New Token Detection — HTML mode (stable, no escaping issues)
// ============================================================
export function formatNewToken(
  token: NewToken,
  identity: IdentityResult,
  aiVerdict: string
): string {
  const lines: string[] = []

  // Header
  const launchpadEmoji: Record<string, string> = {
    'Clanker': '🟣',
    'Bankr': '🔵',
    'Virtuals': '🤖',
    'Flaunch': '🟠',
  }
  const emoji = launchpadEmoji[token.launchpad] || '🆕'

  lines.push(`${emoji} <b>NEW TOKEN — ${token.launchpad.toUpperCase()}</b>`)
  lines.push(`━━━━━━━━━━━━━━━━━━━━`)
  lines.push(`<b>${token.name}</b> (<code>$${token.symbol}</code>)`)
  lines.push('')

  // Contract
  lines.push(`📄 <b>Contract:</b>`)
  lines.push(`<code>${token.address}</code>`)
  lines.push('')

  // Social links
  const links: string[] = []
  if (token.twitterUrl) links.push(`<a href="${token.twitterUrl}">𝕏 Twitter</a>`)
  if (token.telegramUrl) links.push(`<a href="${token.telegramUrl}">💬 Telegram</a>`)
  if (token.websiteUrl) links.push(`<a href="${token.websiteUrl}">🌐 Website</a>`)
  if (token.dexUrl) links.push(`<a href="${token.dexUrl}">📊 Chart</a>`)
  links.push(`<a href="https://basescan.org/token/${token.address}">🔍 BaseScan</a>`)

  lines.push(`🔗 <b>Links:</b> ${links.join('  |  ')}`)
  lines.push('')

  // GitHub
  lines.push(`🐙 <b>GitHub:</b>`)
  if (identity.githubRepo) {
    lines.push(`<a href="${identity.githubRepo}">${identity.githubRepo}</a>`)
    lines.push(`📅 Repo age: <b>${identity.githubAge || 'Unknown'}</b>`)
    if (identity.githubStars !== undefined) {
      lines.push(`⭐ Stars: ${identity.githubStars}`)
    }
    if (identity.isGithubSuspicious) {
      lines.push(`⚠️ <b>SUSPICIOUS: Repo created very recently!</b>`)
    }
  } else {
    lines.push(`❌ No GitHub repo found for this project`)
  }
  lines.push('')

  // Dev wallet
  lines.push(`👤 <b>Dev Wallet:</b>`)
  if (token.devWallet) {
    lines.push(`<code>${token.devWallet}</code>`)
    lines.push(`<a href="https://basescan.org/address/${token.devWallet}">View on BaseScan</a>`)
  } else {
    lines.push('Unknown')
  }
  lines.push('')

  // Market data
  const hasMarket = token.marketCap || token.volume24h
  if (hasMarket) {
    lines.push(`📊 <b>Market:</b>`)
    if (token.marketCap) lines.push(`• Liquidity: $${formatNum(token.marketCap)}`)
    if (token.volume24h) lines.push(`• Vol 24h: $${formatNum(token.volume24h)}`)
    if (token.priceChange24h !== undefined) {
      const dirEmoji = token.priceChange24h >= 0 ? '🟢' : '🔴'
      lines.push(`• Change 24h: ${dirEmoji} ${token.priceChange24h.toFixed(2)}%`)
    }
    lines.push('')
  }

  // AI Verdict — parse and style it nicely
  lines.push(`🤖 <b>Voliton Verdict:</b>`)
  const verdictLines = aiVerdict.split('\n').filter(Boolean)
  for (const line of verdictLines) {
    if (line.startsWith('VERDICT:')) {
      const v = line.replace('VERDICT:', '').trim()
      const vEmoji = v === 'BULLISH' ? '🟢' : v === 'BEARISH' ? '🔴' : '🟡'
      lines.push(`${vEmoji} <b>Verdict:</b> ${v}`)
    } else if (line.startsWith('RISK:')) {
      const r = line.replace('RISK:', '').trim()
      const rEmoji = r === 'LOW' ? '🟢' : r === 'MEDIUM' ? '🟡' : '🔴'
      lines.push(`${rEmoji} <b>Risk:</b> ${r}`)
    } else if (line.startsWith('REASON:')) {
      lines.push(`💬 <b>Reason:</b> ${line.replace('REASON:', '').trim()}`)
    } else if (line.startsWith('ACTION:')) {
      const a = line.replace('ACTION:', '').trim()
      const aEmoji = a === 'POTENTIAL' ? '👀' : a === 'WATCH' ? '⏳' : '🚫'
      lines.push(`${aEmoji} <b>Action:</b> ${a}`)
    } else {
      lines.push(line)
    }
  }

  return lines.join('\n')
}

// ============================================================
// FORMAT: Wallet Activity — HTML
// ============================================================
export function formatWalletActivity(
  wallet: WalletEntry,
  txs: WalletTx[]
): string {
  const lines: string[] = []

  lines.push(`👛 <b>WALLET ACTIVITY</b>`)
  lines.push(`━━━━━━━━━━━━━━━━━━━━`)
  lines.push(`<b>${wallet.label}</b>`)
  lines.push(`<code>${wallet.address}</code>`)
  lines.push(`<a href="https://basescan.org/address/${wallet.address}">View on BaseScan</a>`)
  lines.push('')
  lines.push(`📋 <b>${txs.length} new transaction(s):</b>`)
  lines.push('')

  for (const tx of txs.slice(0, 5)) {
    const dir = tx.direction === 'out' ? '🔴 SELL/SEND' : '🟢 BUY/RECEIVE'
    const decimals = parseInt(tx.tokenDecimal || '18')
    const amount = (Number(BigInt(tx.value || '0')) / 10 ** decimals).toFixed(4)
    const symbol = tx.tokenSymbol || 'TOKEN'
    lines.push(`${dir} <b>${amount} ${symbol}</b>`)
    if (tx.tokenName) lines.push(`Token: ${tx.tokenName}`)
    lines.push(`<a href="https://basescan.org/tx/${tx.hash}">View Transaction</a>`)
    lines.push('')
  }

  return lines.join('\n')
}

// ============================================================
// FORMAT: Dev Dump Alert — HTML
// ============================================================
export function formatDevDump(alert: DevAlert): string {
  const lines: string[] = []

  lines.push(`🚨 <b>DEV DUMP ALERT!</b>`)
  lines.push(`━━━━━━━━━━━━━━━━━━━━`)
  lines.push(`<b>${alert.token.name}</b> (<code>$${alert.token.symbol}</code>)`)
  lines.push('')
  lines.push(`⚠️ Dev wallet is <b>SELLING</b> tokens!`)
  lines.push(`💰 Amount: <b>${alert.amount} tokens</b>`)
  lines.push(`🕐 Time: ${new Date(alert.timestamp).toUTCString()}`)
  lines.push('')
  lines.push(`<a href="https://basescan.org/tx/${alert.txHash}">View Transaction</a>`)
  lines.push(`<a href="https://basescan.org/address/${alert.token.devWallet}">Dev Wallet</a>`)
  if (alert.token.dexUrl) {
    lines.push(`<a href="${alert.token.dexUrl}">📊 Chart</a>`)
  }

  return lines.join('\n')
}

// ============================================================
// HELPERS
// ============================================================
function formatNum(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(2)}K`
  return n.toFixed(2)
}
