const rawApiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').trim()

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return ''
  return baseUrl.replace(/\/+$/, '')
}

const apiBaseUrl = normalizeBaseUrl(rawApiBaseUrl)

export function apiUrl(path) {
  if (!path) return apiBaseUrl || ''
  if (/^https?:\/\//i.test(path)) return path

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  if (!apiBaseUrl) return normalizedPath
  return `${apiBaseUrl}${normalizedPath}`
}
