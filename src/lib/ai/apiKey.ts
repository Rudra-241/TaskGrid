// The assistant calls the Google Gemini API directly from the browser, so the
// user supplies their own key. It is kept in localStorage only (never bundled)
// and read at call time. This is fine for an HCI study / local demo; it would
// not be appropriate for production, where the key belongs on a server.

const KEY = 'taskgrid.geminiKey'

export function getApiKey(): string {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function setApiKey(value: string): void {
  try {
    if (value) localStorage.setItem(KEY, value)
    else localStorage.removeItem(KEY)
  } catch {
    // storage unavailable; the key simply won't persist
  }
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0
}
