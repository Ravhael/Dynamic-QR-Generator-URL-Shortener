// Simple user-agent parser (naive). For richer parsing consider UAParser.js, but keep lightweight for now.

export interface ParsedUA {
  deviceType?: string
  browser?: string
  os?: string
}

export function parseUserAgent(ua: string): ParsedUA {
  const lower = ua.toLowerCase()
  let deviceType: string | undefined
  if (/mobile|iphone|android/.test(lower)) deviceType = 'mobile'
  else if (/tablet|ipad/.test(lower)) deviceType = 'tablet'
  else if (ua) deviceType = 'desktop'

  let browser: string | undefined
  if (/chrome\//.test(lower) && !/edge\//.test(lower)) browser = 'Chrome'
  else if (/edg\//.test(lower)) browser = 'Edge'
  else if (/firefox\//.test(lower)) browser = 'Firefox'
  else if (/safari\//.test(lower) && !/chrome\//.test(lower)) browser = 'Safari'
  else if (/opera|opr\//.test(lower)) browser = 'Opera'

  let os: string | undefined
  if (/windows nt 10/.test(lower)) os = 'Windows 10'
  else if (/windows nt 11/.test(lower)) os = 'Windows 11'
  else if (/mac os x 10_[0-9_]+/.test(lower)) os = 'macOS'
  else if (/android/.test(lower)) os = 'Android'
  else if (/iphone|ipad|ios/.test(lower)) os = 'iOS'
  else if (/linux/.test(lower)) os = 'Linux'

  return { deviceType, browser, os }
}
