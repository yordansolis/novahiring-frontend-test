interface CacheEntry {
  data: unknown
  ts: number
}

const store = new Map<string, CacheEntry>()

const DEFAULT_TTL = 45_000 // 45 s — covers rapid tab switching

export function getCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts: { ttl?: number; force?: boolean } = {}
): Promise<T> {
  const ttl = opts.ttl ?? DEFAULT_TTL
  if (opts.force !== true) {
    const entry = store.get(key)
    if (entry !== undefined && Date.now() - entry.ts < ttl) {
      return Promise.resolve(entry.data as T)
    }
  }
  return fetcher().then((data) => {
    store.set(key, { data, ts: Date.now() })
    return data
  })
}
