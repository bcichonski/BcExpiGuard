// Characterization tests for common/syncMonkey.js: they pin today's behaviour,
// including oddities (called out in comments), and do not fix anything.

describe('syncMonkey', () => {
    let monkey
    let dbProvider
    let randomSpy
    let logSpy

    beforeEach(() => {
        jest.resetModules()
        jest.useFakeTimers()
        // The real persistence module instantiates PouchDB, so replace it.
        jest.doMock('../../persistence', () => ({
            __esModule: true,
            default: {
                replicate: jest.fn(),
                resetReplication: jest.fn()
            }
        }))
        // Math.random() === 0 makes every salt equal its minimum:
        // getSalt(10, 100) === 10 and getSalt(10, 1000) === 10.
        randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0)
        logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
        dbProvider = require('../../persistence').default
        // The module exports a singleton, so reload it for each test.
        monkey = require('../../common/syncMonkey').default
    })

    afterEach(() => {
        monkey.stop()
        jest.clearAllTimers()
        jest.useRealTimers()
        randomSpy.mockRestore()
        logSpy.mockRestore()
        jest.dontMock('../../persistence')
    })

    describe('initial state', () => {
        it('starts at the minimum timeout, idle, with no timer scheduled', () => {
            expect(monkey.timeout).toBe(1000)
            expect(monkey.min_timeout_ms).toBe(1000)
            expect(monkey.max_timeout_ms).toBe(300000)
            expect(monkey.inSync).toBe(false)
            expect(monkey.handle).toBeUndefined()
            expect(jest.getTimerCount()).toBe(0)
        })
    })

    describe('getSalt', () => {
        it('returns the minimum for 0 and stays below the maximum', () => {
            expect(monkey.getSalt(10, 100)).toBe(10)
            randomSpy.mockReturnValue(0.999999)
            expect(monkey.getSalt(10, 100)).toBe(99)
        })

        it('rounds fractional bounds inwards', () => {
            randomSpy.mockReturnValue(0)
            expect(monkey.getSalt(1.2, 5.8)).toBe(2)
            randomSpy.mockReturnValue(0.999999)
            expect(monkey.getSalt(1.2, 5.8)).toBe(4)
        })
    })

    describe('start / stop', () => {
        it('schedules sync after timeout plus salt', () => {
            const syncSpy = jest.spyOn(monkey, 'sync').mockImplementation(() => {})
            monkey.start()
            jest.advanceTimersByTime(1009)
            expect(syncSpy).not.toHaveBeenCalled()
            jest.advanceTimersByTime(1)
            expect(syncSpy).toHaveBeenCalledTimes(1)
        })

        it('keeps only one pending timer when started twice', () => {
            monkey.start()
            monkey.start()
            expect(jest.getTimerCount()).toBe(1)
        })

        it('stop cancels the pending timer and clears the handle', () => {
            const syncSpy = jest.spyOn(monkey, 'sync').mockImplementation(() => {})
            monkey.start()
            monkey.stop()
            expect(monkey.handle).toBeNull()
            jest.advanceTimersByTime(10000)
            expect(syncSpy).not.toHaveBeenCalled()
        })

        it('stop without a pending timer is a no-op', () => {
            expect(() => monkey.stop()).not.toThrow()
        })
    })

    describe('backoff', () => {
        it('multiplies by 1.1 and adds salt at low timeouts', () => {
            monkey.backoff()
            expect(monkey.timeout).toBe(1110) // round(1000 * 1.1) + 10
        })

        it('uses ratio 1.6 once the timeout is above a quarter of the max', () => {
            monkey.timeout = 100000
            monkey.backoff()
            expect(monkey.timeout).toBe(160010)
        })

        it('uses ratio 1.1 at exactly a quarter of the max (strict comparison)', () => {
            monkey.timeout = 75000
            monkey.backoff()
            expect(monkey.timeout).toBe(82510)
        })

        it('never uses the 1.3 ratio (oddity: unreachable branch)', () => {
            // The "> max / 2" branch is tested after "> max / 4", so anything above
            // half the max has already matched the 1.6 branch. Pinned, not fixed.
            monkey.timeout = 151000
            monkey.backoff()
            expect(monkey.timeout).toBe(241610) // 151000 * 1.6 + 10, not * 1.3
        })

        it('caps the timeout at the maximum', () => {
            monkey.timeout = 200000
            monkey.backoff()
            expect(monkey.timeout).toBe(300000)
        })

        it('resets to the minimum when the timeout is below the minimum', () => {
            monkey.timeout = 500
            monkey.backoff()
            expect(monkey.timeout).toBe(1000)
            expect(jest.getTimerCount()).toBe(1) // reset restarts the timer
        })

        it('resets to the minimum when the timeout is not a number', () => {
            monkey.timeout = '5000'
            monkey.backoff()
            expect(monkey.timeout).toBe(1000)
        })
    })

    describe('reset', () => {
        it('returns to the minimum timeout and restarts the timer when idle', () => {
            monkey.timeout = 50000
            monkey.reset()
            expect(monkey.timeout).toBe(1000)
            expect(monkey.handle).toBeTruthy()
            expect(jest.getTimerCount()).toBe(1)
        })

        it('is deferred while a sync is running', () => {
            monkey.timeout = 50000
            monkey.inSync = true
            monkey.reset()
            expect(monkey.resetAfterSync).toBe(true)
            expect(monkey.timeout).toBe(50000)
            expect(jest.getTimerCount()).toBe(0)
        })
    })

    describe('wake-up hooks', () => {
        it('does not call the hook at or below one minute', () => {
            const hookFn = jest.fn()
            monkey.setWakeUpHooks(hookFn, jest.fn())
            monkey.setTimeout(60000)
            expect(hookFn).not.toHaveBeenCalled()
        })

        it('calls the hook once the timeout exceeds one minute', () => {
            const hookFn = jest.fn()
            const cleanFn = jest.fn()
            monkey.setWakeUpHooks(hookFn, cleanFn)
            monkey.setTimeout(60001)
            expect(hookFn).toHaveBeenCalledTimes(1)

            // The callback handed to the hook resets the monkey, then cleans up.
            hookFn.mock.calls[0][0]()
            expect(monkey.timeout).toBe(1000)
            expect(cleanFn).toHaveBeenCalledTimes(1)
        })

        it('needs both hooks to be installed', () => {
            const hookFn = jest.fn()
            monkey.setWakeUpHooks(hookFn, undefined)
            monkey.setTimeout(120000)
            expect(hookFn).not.toHaveBeenCalled()
        })

        it('does nothing when the timeout value is unchanged', () => {
            const hookFn = jest.fn()
            monkey.setWakeUpHooks(hookFn, jest.fn())
            monkey.setTimeout(120000)
            monkey.setTimeout(120000)
            expect(hookFn).toHaveBeenCalledTimes(1)
        })
    })

    describe('sync', () => {
        it('backs off and reschedules when nothing changed', async () => {
            dbProvider.replicate.mockResolvedValue(false)
            await monkey.sync()
            expect(dbProvider.replicate).toHaveBeenNthCalledWith(1, 'item_names')
            expect(dbProvider.replicate).toHaveBeenNthCalledWith(2, 'items')
            expect(monkey.timeout).toBe(1110)
            expect(monkey.inSync).toBe(false)
            expect(jest.getTimerCount()).toBe(1)
        })

        it('returns to the minimum timeout when items changed', async () => {
            monkey.timeout = 50000
            dbProvider.replicate.mockImplementation(async name => name === 'items')
            await monkey.sync()
            expect(monkey.timeout).toBe(1000)
            expect(monkey.resetAfterSync).toBe(false)
            expect(jest.getTimerCount()).toBe(1)
        })

        it('returns to the minimum timeout when only item names changed', async () => {
            monkey.timeout = 50000
            dbProvider.replicate.mockImplementation(async name => name === 'item_names')
            await monkey.sync()
            expect(dbProvider.replicate).toHaveBeenCalledTimes(2)
            expect(monkey.timeout).toBe(1000)
        })

        it('resets replication and backs off when replication fails', async () => {
            dbProvider.replicate.mockRejectedValue(new Error('offline'))
            await monkey.sync()
            expect(dbProvider.resetReplication).toHaveBeenCalledTimes(1)
            expect(monkey.timeout).toBe(1110)
            expect(monkey.inSync).toBe(false)
            expect(jest.getTimerCount()).toBe(1)
        })

        it('applies a reset requested mid-sync after the backoff', async () => {
            let resolveReplicate
            dbProvider.replicate.mockImplementationOnce(
                () => new Promise(resolve => { resolveReplicate = resolve })
            ).mockResolvedValue(false)

            const pending = monkey.sync()
            expect(monkey.inSync).toBe(true)
            monkey.reset()
            expect(monkey.resetAfterSync).toBe(true)

            resolveReplicate(false)
            await pending

            // backoff ran first (1110) and the deferred reset then put it back.
            expect(monkey.timeout).toBe(1000)
            expect(monkey.resetAfterSync).toBe(false)
            expect(monkey.inSync).toBe(false)
            expect(jest.getTimerCount()).toBe(1)
        })

        it('runs again when the scheduled timer fires', async () => {
            dbProvider.replicate.mockResolvedValue(false)
            await monkey.sync()
            const callsAfterFirst = dbProvider.replicate.mock.calls.length
            jest.advanceTimersByTime(1110 + 100)
            expect(dbProvider.replicate.mock.calls.length).toBeGreaterThan(callsAfterFirst)
        })
    })
})
