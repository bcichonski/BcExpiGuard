// Debug-gated logger. debug/info are emitted only in Vite DEV or when localStorage['expiguard:debug'] === '1'.
// warn/error are always emitted.
const DEBUG_FLAG_KEY = 'expiguard:debug'

export function isDebugEnabled() {
  if (import.meta.env.DEV) {
    return true
  }
  try {
    return globalThis.localStorage?.getItem(DEBUG_FLAG_KEY) === '1'
  } catch {
    // localStorage can throw (private mode, blocked site data)
    return false
  }
}

const logger = {
  debug: (...args) => { if (isDebugEnabled()) console.debug(...args) },
  info: (...args) => { if (isDebugEnabled()) console.info(...args) },
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
}

export default logger
