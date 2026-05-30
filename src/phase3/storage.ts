import fs from 'fs'
import path from 'path'
import { config } from '../config'
import { VoiceEventType, VoiceLogEntry, VoiceLogStorage } from './types'

const DATA_DIR = path.join(process.cwd(), 'data')
const STORAGE_FILE = path.join(DATA_DIR, 'voice-log.json')

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function load(): VoiceLogStorage {
  ensureDir()
  if (!fs.existsSync(STORAGE_FILE)) {
    return { entries: [] }
  }

  try {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8')
    return JSON.parse(raw) as VoiceLogStorage
  } catch {
    return { entries: [] }
  }
}

function save(data: VoiceLogStorage): void {
  ensureDir()
  const maxEntries = Math.max(100, config.x.voiceLogMaxEntries)
  const trimmed = {
    entries: data.entries.slice(-maxEntries),
  }
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(trimmed, null, 2), 'utf-8')
}

export function appendVoiceLog(entry: VoiceLogEntry): void {
  const data = load()
  data.entries.push(entry)
  save(data)
}

export function getVoiceLogEntries(): VoiceLogEntry[] {
  return load().entries
}

export function findVoiceLogByEventKey(eventKey: string): VoiceLogEntry | undefined {
  return load().entries
    .slice()
    .reverse()
    .find(entry => entry.eventKey === eventKey && entry.status !== 'failed')
}

export function findRecentVoiceLog(
  type: VoiceEventType,
  eventKey: string,
  windowMs: number
): VoiceLogEntry | undefined {
  const cutoff = Date.now() - windowMs

  return load().entries
    .slice()
    .reverse()
    .find(entry => {
      if (entry.type !== type || entry.eventKey !== eventKey) return false
      if (entry.status === 'failed') return false
      return new Date(entry.createdAt).getTime() >= cutoff
    })
}
