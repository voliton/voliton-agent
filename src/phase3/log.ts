import { getVoiceLogEntries } from './storage'
import { VoiceEventType, VoiceLogEntry, VoicePostStatus } from './types'

interface LogOptions {
  limit: number
  status?: VoicePostStatus
  type?: VoiceEventType
}

function parseArgs(argv: string[]): LogOptions {
  const options: LogOptions = { limit: 20 }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    const next = argv[i + 1]

    if (arg === '--limit' && next) {
      options.limit = Math.max(1, parseInt(next))
      i += 1
    } else if (arg === '--status' && next) {
      options.status = next as VoicePostStatus
      i += 1
    } else if (arg === '--type' && next) {
      options.type = next as VoiceEventType
      i += 1
    }
  }

  return options
}

function countBy<T extends string>(entries: VoiceLogEntry[], pick: (entry: VoiceLogEntry) => T | undefined): Record<T, number> {
  return entries.reduce((acc, entry) => {
    const key = pick(entry)
    if (!key) return acc
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {} as Record<T, number>)
}

function latest(entries: VoiceLogEntry[], status: VoicePostStatus): VoiceLogEntry | undefined {
  return entries
    .slice()
    .reverse()
    .find(entry => entry.status === status)
}

function compactText(text: string): string {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join(' / ')
    .slice(0, 140)
}

function printEntry(entry: VoiceLogEntry): void {
  const meta = [
    entry.reason ? `reason=${entry.reason}` : '',
    entry.xPostId ? `x=${entry.xPostId}` : '',
    entry.error ? `error=${entry.error.slice(0, 100)}` : '',
  ].filter(Boolean).join(' ')

  console.log(`${entry.createdAt}  ${entry.status.padEnd(7)}  ${entry.type.padEnd(15)}  ${entry.eventKey}`)
  if (meta) console.log(`  ${meta}`)
  console.log(`  ${compactText(entry.text)}`)
}

function main(): void {
  const options = parseArgs(process.argv.slice(2))
  const allEntries = getVoiceLogEntries()
  const filtered = allEntries.filter(entry => {
    if (options.status && entry.status !== options.status) return false
    if (options.type && entry.type !== options.type) return false
    return true
  })
  const recent = filtered.slice(-options.limit).reverse()

  console.log('Voliton Voice Log')
  console.log('=================')
  console.log(`Total entries: ${allEntries.length}`)
  console.log(`Filtered entries: ${filtered.length}`)
  console.log(`Status counts: ${JSON.stringify(countBy(allEntries, entry => entry.status))}`)
  console.log(`Type counts: ${JSON.stringify(countBy(allEntries, entry => entry.type))}`)
  console.log(`Skip reasons: ${JSON.stringify(countBy(allEntries, entry => entry.reason))}`)

  const lastPosted = latest(allEntries, 'posted')
  const lastSkipped = latest(allEntries, 'skipped')
  const lastFailed = latest(allEntries, 'failed')

  console.log(`Last posted: ${lastPosted ? `${lastPosted.createdAt} ${lastPosted.eventKey}` : 'none'}`)
  console.log(`Last skipped: ${lastSkipped ? `${lastSkipped.createdAt} ${lastSkipped.eventKey} (${lastSkipped.reason || 'unknown'})` : 'none'}`)
  console.log(`Last failed: ${lastFailed ? `${lastFailed.createdAt} ${lastFailed.eventKey}` : 'none'}`)

  console.log(`\nRecent entries (${recent.length}):`)
  if (recent.length === 0) {
    console.log('No voice log entries found.')
    return
  }

  for (const entry of recent) {
    printEntry(entry)
  }
}

main()
