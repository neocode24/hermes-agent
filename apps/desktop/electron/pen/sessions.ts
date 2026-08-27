// Persist which canvas belongs to which chat. Path is what survives a
// restart; a missing file is forgotten, not fatal.

import fs from 'node:fs'
import path from 'node:path'

export interface PenSessionEntry {
  at?: number
  closed?: boolean
  docId?: string
  path?: null | string
}

export type PenSessionMap = Record<string, PenSessionEntry>

export function readPenSessions(filePath: string): PenSessionMap {
  try {
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

export function writePenSessions(filePath: string, map: PenSessionMap): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true })
    fs.writeFileSync(filePath, JSON.stringify(map, null, 2))
  } catch {
    // Convenience only — never block opening a canvas.
  }
}

export function rememberPenSession(
  filePath: string,
  sessionId: null | string | undefined,
  entry: Partial<PenSessionEntry>
): void {
  if (!sessionId) {
    return
  }

  const map = readPenSessions(filePath)

  map[sessionId] = { ...map[sessionId], ...entry, at: Date.now() }
  writePenSessions(filePath, map)
}

export function forgetPenSession(filePath: string, sessionId: null | string | undefined): void {
  if (!sessionId) {
    return
  }

  const map = readPenSessions(filePath)

  if (map[sessionId]) {
    delete map[sessionId]
    writePenSessions(filePath, map)
  }
}

export function retargetPenSessionPaths(filePath: string, oldPath: string, newPath: string): void {
  const map = readPenSessions(filePath)
  const from = path.resolve(oldPath)
  let changed = false

  for (const entry of Object.values(map)) {
    if (entry.path && path.resolve(entry.path) === from) {
      entry.path = newPath
      changed = true
    }
  }

  if (changed) {
    writePenSessions(filePath, map)
  }
}

export function sessionIdByCanvasPath(map: PenSessionMap): Map<string, string> {
  const byPath = new Map<string, string>()

  for (const [sessionId, entry] of Object.entries(map)) {
    if (entry?.path) {
      byPath.set(path.resolve(entry.path), sessionId)
    }
  }

  return byPath
}
