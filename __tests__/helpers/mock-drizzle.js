/**
 * Minimal drizzle-style query builder mock.
 * Supports chained calls and queued return values for select/insert/update/delete.
 */
export function createMockDb() {
  const queues = {
    select: [],
    insert: [],
    update: [],
    delete: [],
  }

  function take(kind) {
    if (!queues[kind].length) {
      return []
    }
    return queues[kind].shift()
  }

  function makeChain(kind) {
    const state = { terminal: () => take(kind) }
    const chain = {}

    const passthrough = [
      'from',
      'where',
      'orderBy',
      'groupBy',
      'limit',
      'offset',
      'values',
      'set',
      'leftJoin',
      'innerJoin',
    ]

    passthrough.forEach((method) => {
      chain[method] = jest.fn(() => chain)
    })

    chain.returning = jest.fn(async () => state.terminal())
    chain.onConflictDoNothing = jest.fn(async () => undefined)

    // Allow `await db.select()...where()` without `.returning()`
    chain.then = (resolve, reject) =>
      Promise.resolve(state.terminal()).then(resolve, reject)

    return chain
  }

  return {
    select: jest.fn(() => makeChain('select')),
    insert: jest.fn(() => makeChain('insert')),
    update: jest.fn(() => makeChain('update')),
    delete: jest.fn(() => makeChain('delete')),
    enqueueSelect(...values) {
      queues.select.push(...values)
    },
    enqueueInsert(...values) {
      queues.insert.push(...values)
    },
    enqueueUpdate(...values) {
      queues.update.push(...values)
    },
    enqueueDelete(...values) {
      queues.delete.push(...values)
    },
    _queues: queues,
  }
}

export function createTeamServiceMock(overrides = {}) {
  return {
    requireMembership: jest.fn().mockResolvedValue({ role: 'member', status: 'active' }),
    assertManager: jest.fn().mockResolvedValue({ role: 'admin', status: 'active' }),
    ...overrides,
  }
}
