import fs from 'fs'
import path from 'path'
import { WalletEntry, WalletStorage } from '../types'

const DATA_DIR = path.join(process.cwd(), 'data')
const STORAGE_FILE = path.join(DATA_DIR, 'wallets.json')

function ensureDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function load(): WalletStorage {
  ensureDir()
  if (!fs.existsSync(STORAGE_FILE)) {
    return { wallets: [] }
  }
  try {
    const raw = fs.readFileSync(STORAGE_FILE, 'utf-8')
    return JSON.parse(raw) as WalletStorage
  } catch {
    return { wallets: [] }
  }
}

function save(data: WalletStorage): void {
  ensureDir()
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// Add a wallet. Returns false if already exists.
export function addWallet(address: string, label: string, chatId: string): boolean {
  const data = load()
  const norm = address.toLowerCase()
  const exists = data.wallets.find(w => w.address === norm)
  if (exists) return false

  data.wallets.push({
    address: norm,
    label,
    addedAt: new Date().toISOString(),
    chatId,
  })
  save(data)
  return true
}

// Remove a wallet. Returns false if not found.
export function removeWallet(address: string): boolean {
  const data = load()
  const norm = address.toLowerCase()
  const before = data.wallets.length
  data.wallets = data.wallets.filter(w => w.address !== norm)
  save(data)
  return data.wallets.length < before
}

// Get wallets for a specific chat, or all wallets
export function getWallets(chatId?: string): WalletEntry[] {
  const data = load()
  if (chatId) {
    return data.wallets.filter(w => w.chatId === chatId)
  }
  return data.wallets
}

export function getAllWallets(): WalletEntry[] {
  return load().wallets
}
