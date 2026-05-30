import { LaunchpadPlugin, NewToken } from '../../types'

// Base class for all launchpad plugins
// To add a new launchpad: extend this class, implement name + fetch()
export abstract class BaseLaunchpadPlugin implements LaunchpadPlugin {
  abstract name: string
  abstract fetch(): Promise<NewToken[]>

  protected log(msg: string) {
    console.log(`[${this.name}] ${msg}`)
  }

  protected error(msg: string, err?: any) {
    console.error(`[${this.name}] ⚠️ ${msg}`, err?.message || '')
  }
}
