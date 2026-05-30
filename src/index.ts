import { validateConfig } from './config'
import { VolitonAgent } from './agent'
import { Phase2 } from './phase2/index'

async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('          VOLITON AGENT v0.2          ')
  console.log('     Autonomous AI Agent on Base      ')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  validateConfig()

  const agent = new VolitonAgent()

  const connected = await agent.testConnection()
  if (!connected) {
    console.error('\n❌ Cannot connect to Claude. Check your MAIA_API_KEY.')
    process.exit(1)
  }

  const phase2 = new Phase2(agent)
  await phase2.start()

  process.on('SIGINT', () => {
    console.log('\n\n⏹️  Shutting down Voliton...')
    phase2.stop()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\n\n⏹️  Shutting down Voliton...')
    phase2.stop()
    process.exit(0)
  })
}

main().catch((err) => {
  console.error('❌ Fatal error:', err)
  process.exit(1)
})
