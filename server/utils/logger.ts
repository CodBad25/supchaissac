const isProduction = process.env.NODE_ENV === 'production'

interface LogEntry {
  level: string
  message: string
  [key: string]: unknown
}

function formatLog(entry: LogEntry): string {
  if (isProduction) {
    return JSON.stringify({ ...entry, timestamp: new Date().toISOString() })
  }
  const prefix = entry.level === 'error' ? '❌' : entry.level === 'warn' ? '⚠️' : entry.level === 'debug' ? '🔍' : 'ℹ️'
  const extra = Object.keys(entry).filter(k => k !== 'level' && k !== 'message').length > 0
    ? ' ' + JSON.stringify(Object.fromEntries(Object.entries(entry).filter(([k]) => k !== 'level' && k !== 'message')))
    : ''
  return `${prefix} ${entry.message}${extra}`
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>) {
    console.log(formatLog({ level: 'info', message, ...meta }))
  },
  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(formatLog({ level: 'warn', message, ...meta }))
  },
  error(message: string, meta?: Record<string, unknown>) {
    console.error(formatLog({ level: 'error', message, ...meta }))
  },
  debug(message: string, meta?: Record<string, unknown>) {
    if (!isProduction) {
      console.debug(formatLog({ level: 'debug', message, ...meta }))
    }
  },
}
