import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { test } from 'vitest'

import {
  forgetPenSession,
  readPenSessions,
  rememberPenSession,
  retargetPenSessionPaths,
  sessionIdByCanvasPath,
  writePenSessions
} from './sessions'

function tmpStore(): string {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'pen-sessions-')), 'pen-canvas-sessions.json')
}

test('remember then read by session', () => {
  const file = tmpStore()

  rememberPenSession(file, 'chat-1', { docId: 'doc-1', path: '/pens/a.pen' })

  const entry = readPenSessions(file)['chat-1']

  assert.equal(entry?.docId, 'doc-1')
  assert.equal(entry?.path, '/pens/a.pen')
})

test('a session only sees its own tie', () => {
  const file = tmpStore()

  writePenSessions(file, {
    older: { docId: 'doc-old', path: '/pens/old.pen', at: 1 },
    newer: { docId: 'doc-new', path: '/pens/new.pen', at: 2 },
    other: { docId: 'doc-other', path: '/pens/other.pen', at: 3 }
  })

  assert.equal(readPenSessions(file).other?.path, '/pens/other.pen')
  assert.equal(readPenSessions(file).missing, undefined)
})

test('forget drops the session; retarget follows a rename', () => {
  const file = tmpStore()

  rememberPenSession(file, 'chat-1', { path: '/pens/old.pen' })
  retargetPenSessionPaths(file, '/pens/old.pen', '/pens/renamed.pen')
  assert.equal(readPenSessions(file)['chat-1']?.path, '/pens/renamed.pen')

  forgetPenSession(file, 'chat-1')
  assert.equal(readPenSessions(file)['chat-1'], undefined)
})

test('sessionIdByCanvasPath indexes ties by resolved path', () => {
  const file = tmpStore()

  rememberPenSession(file, 'chat-1', { path: '/pens/a.pen' })

  assert.equal(sessionIdByCanvasPath(readPenSessions(file)).get(path.resolve('/pens/a.pen')), 'chat-1')
})
