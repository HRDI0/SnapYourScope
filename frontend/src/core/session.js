import { apiUrl } from './api'

export function getStoredLanguage(defaultLanguage = 'en') {
  return localStorage.getItem('ui_lang') || defaultLanguage
}

export function setStoredLanguage(language) {
  localStorage.setItem('ui_lang', language)
}

export function applyDocumentLanguage(language) {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : language
}

export async function fetchUserTier() {
  const token = localStorage.getItem('access_token')
  if (!token) return 'free'

  try {
    const response = await fetch(apiUrl('/api/users/me'), {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return 'free'
    const data = await response.json()
    return (data?.tier || 'free').toLowerCase()
  } catch {
    return 'free'
  }
}

export function isPaidTier(tier) {
  return tier === 'pro' || tier === 'enterprise'
}
