// Talks to OREN's API. Two ways, same answers:
//  • on the laptop, over HTTP to the Express server (server/, port 4000; Vite forwards /api in development)
//  • on GitHub Pages (built with VITE_DB=browser), to the database running inside this browser (browser-api.js)
export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status }
}

export const BROWSER_DB = import.meta.env.VITE_DB === 'browser'
let local = null

export async function api(path, { method = 'GET', body } = {}) {
  if (BROWSER_DB) {
    local ||= import('./browser-api.js').then((m) => m.start())
    const run = await local
    const out = await run(method, path, body ?? {})
    if (out.status >= 400) throw new ApiError(out.data?.error || 'Something went wrong with the database.', out.status)
    return out.data
  }
  let res
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: 'same-origin',
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the OREN server. Start it with npm run dev.', 0)
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || (res.status >= 500 ? 'The server could not do that. Check that PostgreSQL is running.' : `The server answered ${res.status}.`), res.status)
  return data
}
