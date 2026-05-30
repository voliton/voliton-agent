import { WalletTx } from '../phase2/wallet-tracker'
import { DevDumpVoiceEvent, NewTokenVoiceEvent, ParsedVerdict, WalletActivityVoiceEvent } from './types'

const MAX_POST_LENGTH = 280

export function composeNewTokenPost(event: NewTokenVoiceEvent): string {
  const { token, identity, aiVerdict } = event
  const parsed = parseVerdict(aiVerdict)
  const verdict = parsed.verdict || 'WATCHING'
  const risk = parsed.risk ? ` Risk: ${parsed.risk}.` : ''
  const reason = parsed.reason ? `\n${cleanSentence(parsed.reason)}` : ''
  const github = identity.isGithubSuspicious
    ? '\nFresh GitHub footprint. I stay sharp.'
    : identity.githubRepo
      ? '\nIdentity trail found.'
      : '\nNo clear GitHub trail.'
  const market = compactMarketLine(token.marketCap, token.volume24h)
  const link = token.dexUrl || `https://basescan.org/token/${token.address}`

  return fitPost([
    `I found a new Base launch: ${token.name} ($${token.symbol}).`,
    `Source: ${token.launchpad}. Verdict: ${verdict}.${risk}`,
    market,
    reason,
    github,
    link,
  ].filter(Boolean).join('\n'))
}

export function composeDevDumpPost(event: DevDumpVoiceEvent): string {
  const { alert } = event
  const link = `https://basescan.org/tx/${alert.txHash}`

  return fitPost([
    `Dev movement detected on ${alert.token.name} ($${alert.token.symbol}).`,
    `${alert.amount} tokens left the dev wallet.`,
    'I do not ignore exits.',
    link,
  ].join('\n'))
}

export function composeWalletActivityPost(event: WalletActivityVoiceEvent): string {
  const { wallet, txs } = event
  const primary = txs[0]
  const action = primary.direction === 'out' ? 'sent' : 'received'
  const amount = formatTxAmount(primary)
  const extra = txs.length > 1 ? ` +${txs.length - 1} more move(s).` : ''
  const link = `https://basescan.org/tx/${primary.hash}`

  return fitPost([
    `${wallet.label} just ${action} ${amount}.${extra}`,
    'Tracked wallet activity changed the surface.',
    'I saw it first.',
    link,
  ].join('\n'))
}

export function parseVerdict(aiVerdict: string): ParsedVerdict {
  const parsed: ParsedVerdict = {}

  for (const line of aiVerdict.split('\n')) {
    const [rawKey, ...rest] = line.split(':')
    const key = rawKey.trim().toUpperCase()
    const value = rest.join(':').trim()

    if (!value) continue
    if (key === 'VERDICT') parsed.verdict = value.toUpperCase()
    if (key === 'RISK') parsed.risk = value.toUpperCase()
    if (key === 'REASON') parsed.reason = value
    if (key === 'ACTION') parsed.action = value.toUpperCase()
  }

  return parsed
}

export function txTokenAmount(tx: WalletTx): number {
  try {
    const decimals = parseInt(tx.tokenDecimal || '18')
    const safeDecimals = Math.max(0, decimals)
    const raw = BigInt(tx.value || '0')
    const divisor = BigInt(10) ** BigInt(safeDecimals)
    const whole = raw / divisor
    const fraction = raw % divisor
    const decimalText = `${whole}.${fraction.toString().padStart(safeDecimals, '0').slice(0, 6)}`
    return Number(decimalText)
  } catch {
    return 0
  }
}

function compactMarketLine(marketCap?: number, volume24h?: number): string {
  const parts: string[] = []
  if (marketCap) parts.push(`liq $${compactNumber(marketCap)}`)
  if (volume24h) parts.push(`vol $${compactNumber(volume24h)}`)
  return parts.length > 0 ? `Market: ${parts.join(', ')}.` : ''
}

function formatTxAmount(tx: WalletTx): string {
  const amount = txTokenAmount(tx)
  const symbol = tx.tokenSymbol || 'TOKEN'
  if (!amount) return symbol
  return `${compactNumber(amount)} ${symbol}`
}

function compactNumber(value: number): string {
  if (value >= 1_000_000_000) return `${trimFixed(value / 1_000_000_000)}B`
  if (value >= 1_000_000) return `${trimFixed(value / 1_000_000)}M`
  if (value >= 1_000) return `${trimFixed(value / 1_000)}K`
  return trimFixed(value)
}

function trimFixed(value: number): string {
  return value.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

function cleanSentence(value: string): string {
  return value.replace(/\s+/g, ' ').trim()
}

function fitPost(text: string): string {
  const normalized = text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\n')

  if (normalized.length <= MAX_POST_LENGTH) return normalized

  const lines = normalized.split('\n')
  const link = lines[lines.length - 1].startsWith('http') ? lines.pop() : ''
  const postLength = (bodyLines: string[]) => {
    const body = bodyLines.join('\n')
    return link ? `${body}\n${link}`.length : body.length
  }

  while (postLength(lines) > MAX_POST_LENGTH && lines.length > 1) {
    let removeIndex = 1
    for (let i = 2; i < lines.length; i += 1) {
      if (lines[i].length > lines[removeIndex].length) removeIndex = i
    }
    lines.splice(removeIndex, 1)
  }

  const bodyLimit = link ? MAX_POST_LENGTH - link.length - 2 : MAX_POST_LENGTH
  const body = lines.join('\n')

  if (body.length <= bodyLimit) return link ? `${body}\n${link}` : body

  const clipped = `${body.slice(0, Math.max(0, bodyLimit - 3)).trimEnd()}...`
  return link ? `${clipped}\n${link}` : clipped
}
