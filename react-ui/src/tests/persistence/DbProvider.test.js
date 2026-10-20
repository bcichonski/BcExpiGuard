import { vi } from 'vitest'
import PouchDB from 'pouchdb'
import DbProvider from '../../persistence/DbProvider'

// Keep PouchDB, IndexedDB and the network out: every table is a stub that can be closed.
vi.mock('pouchdb', () => ({
    __esModule: true,
    default: vi.fn(function PouchDB(name) {
        this.name = name
        this.close = vi.fn().mockResolvedValue(undefined)
        this.destroy = vi.fn().mockResolvedValue(undefined)
    }),
}))

vi.mock('../../persistence/users', () => ({
    __esModule: true,
    default: { getId: vi.fn(() => 'user-id'), add: vi.fn() },
}))

const user = { name: 'Jane', email: 'jane@example.com' }

const deferred = () => {
    let resolve
    let reject
    const promise = new Promise((res, rej) => { resolve = res; reject = rej })
    return { promise, resolve, reject }
}

describe('DbProvider login/logout', () => {
    let provider
    let onLoginFn

    beforeEach(() => {
        vi.clearAllMocks()
        provider = new DbProvider()
        onLoginFn = vi.fn()
        provider.onLogin(onLoginFn)
        vi.spyOn(provider, 'Login')
    })

    it('logs in once when two calls race while the token is pending', async () => {
        const token = deferred()
        const getToken = vi.fn(() => token.promise)

        const first = provider.useUserAsync(true, user, getToken)
        const second = provider.useUserAsync(true, user, getToken)
        token.resolve('token-1')
        await Promise.all([first, second])

        expect(getToken).toHaveBeenCalledTimes(1)
        expect(provider.Login).toHaveBeenCalledTimes(1)
        expect(provider.Login).toHaveBeenCalledWith(user, getToken)
        expect(onLoginFn).toHaveBeenCalledTimes(1)
        expect(provider.logged).toBe(true)
        expect(provider.session.getToken).toBe(getToken)
    })

    it('waits for the in-flight login before resolving the second call', async () => {
        const token = deferred()
        const first = provider.useUserAsync(true, user, () => token.promise)
        let secondDone = false
        const second = provider.useUserAsync(true, user, vi.fn()).then(() => { secondDone = true })

        await Promise.resolve()
        expect(secondDone).toBe(false)

        token.resolve('token-1')
        await Promise.all([first, second])
        expect(secondDone).toBe(true)
        expect(provider.logged).toBe(true)
    })

    it('does not log in again once logged in', async () => {
        const getToken = vi.fn().mockResolvedValue('token-1')
        await provider.useUserAsync(true, user, getToken)
        await provider.useUserAsync(true, user, getToken)

        expect(getToken).toHaveBeenCalledTimes(1)
        expect(provider.Login).toHaveBeenCalledTimes(1)
        expect(onLoginFn).toHaveBeenCalledTimes(1)
    })

    it('does nothing while the user object is missing', async () => {
        const getToken = vi.fn().mockResolvedValue('token-1')
        await provider.useUserAsync(true, undefined, getToken)

        expect(getToken).not.toHaveBeenCalled()
        expect(provider.Login).not.toHaveBeenCalled()
        expect(provider.logged).toBe(false)
    })

    it('logs out after login, closing the remote tables', async () => {
        await provider.useUserAsync(true, user, vi.fn().mockResolvedValue('token-1'))
        const remote = provider.remote

        await provider.useUserAsync(false, undefined, vi.fn())

        expect(provider.logged).toBe(false)
        expect(provider.session).toBeUndefined()
        expect(provider.userId).toBeUndefined()
        expect(remote.users.remote_table.close).toHaveBeenCalledTimes(1)
        expect(remote.items.remote_table.close).toHaveBeenCalledTimes(1)
        expect(remote.groups.remote_table.close).toHaveBeenCalledTimes(1)
    })

    it('is safe to log out repeatedly and without a login', async () => {
        await expect(provider.Logout()).resolves.toBeUndefined()

        await provider.useUserAsync(true, user, vi.fn().mockResolvedValue('token-1'))
        const remote = provider.remote
        await provider.Logout()
        await provider.Logout()

        expect(provider.logged).toBe(false)
        expect(remote.users.remote_table.close).toHaveBeenCalledTimes(1)
    })

    it('logs in again after a logout', async () => {
        await provider.useUserAsync(true, user, vi.fn().mockResolvedValue('token-1'))
        await provider.Logout()
        const secondGetToken = vi.fn().mockResolvedValue('token-2')
        await provider.useUserAsync(true, user, secondGetToken)

        expect(provider.Login).toHaveBeenCalledTimes(2)
        expect(onLoginFn).toHaveBeenCalledTimes(2)
        expect(provider.logged).toBe(true)
        expect(provider.session.getToken).toBe(secondGetToken)
    })

    it('cancels a login whose token arrives after a logout', async () => {
        const token = deferred()
        const pending = provider.useUserAsync(true, user, () => token.promise)

        await provider.useUserAsync(false, undefined, vi.fn())
        token.resolve('stale-token')
        await pending

        expect(provider.Login).not.toHaveBeenCalled()
        expect(onLoginFn).not.toHaveBeenCalled()
        expect(provider.logged).toBe(false)
        expect(provider.session).toBeUndefined()
    })

    it('lets a new login proceed while a cancelled one is still waiting for its token', async () => {
        const staleToken = deferred()
        const stale = provider.useUserAsync(true, user, () => staleToken.promise)
        await provider.Logout()

        const freshToken = deferred()
        const freshGetToken = () => freshToken.promise
        const fresh = provider.useUserAsync(true, user, freshGetToken)

        staleToken.resolve('stale-token')
        await stale
        expect(provider.Login).not.toHaveBeenCalled()

        // The stale login finishing must not drop the fresh one's guard.
        const duplicate = provider.useUserAsync(true, user, vi.fn())
        freshToken.resolve('fresh-token')
        await Promise.all([fresh, duplicate])

        expect(provider.Login).toHaveBeenCalledTimes(1)
        expect(provider.Login).toHaveBeenCalledWith(user, freshGetToken)
        expect(onLoginFn).toHaveBeenCalledTimes(1)
        expect(provider.logged).toBe(true)
    })

    it('allows a retry after the token request fails', async () => {
        await expect(
            provider.useUserAsync(true, user, vi.fn().mockRejectedValue(new Error('login_required')))
        ).rejects.toThrow('login_required')
        expect(provider.logged).toBe(false)

        await provider.useUserAsync(true, user, vi.fn().mockResolvedValue('token-1'))
        expect(provider.Login).toHaveBeenCalledTimes(1)
        expect(provider.logged).toBe(true)
    })

    describe('remote auth', () => {
        it('creates every remote with the fetch wrapper and no fixed Authorization header', async () => {
            await provider.useUserAsync(true, user, vi.fn().mockResolvedValue('token-1'))

            // Local tables are created without options; remotes get the fetch wrapper.
            const remoteCalls = vi.mocked(PouchDB).mock.calls.filter(([, opts]) => opts !== undefined)
            expect(remoteCalls.map(([name]) => name.split('/').pop()).sort())
                .toEqual(['groups', 'item_names', 'items', 'users'])
            for (const [, opts] of remoteCalls) {
                expect(opts).toEqual({ fetch: expect.any(Function) })
                expect(opts.fetch).toBe(provider.remoteFetch)
            }
        })

        it('fails remote requests fast after logout, without asking for a token', async () => {
            const getToken = vi.fn().mockResolvedValue('token-1')
            await provider.useUserAsync(true, user, getToken)
            const remoteFetch = provider.remoteFetch
            getToken.mockClear()

            await provider.Logout()

            await expect(remoteFetch('https://couch.example/items/_changes', {})).rejects.toThrow(/logout/)
            expect(getToken).not.toHaveBeenCalled()
            expect(provider.remoteFetch).toBeUndefined()
        })

        it('does not reuse the previous user\'s getter after a re-login', async () => {
            const firstGetToken = vi.fn().mockResolvedValue('token-1')
            await provider.useUserAsync(true, user, firstGetToken)
            const oldFetch = provider.remoteFetch
            await provider.Logout()
            await provider.useUserAsync(true, user, vi.fn().mockResolvedValue('token-2'))
            firstGetToken.mockClear()

            await expect(oldFetch('https://couch.example/items/_changes', {})).rejects.toThrow(/logout/)
            expect(firstGetToken).not.toHaveBeenCalled()
            expect(provider.remoteFetch).not.toBe(oldFetch)
        })
    })

    describe('live sync wiring', () => {
        const fakeLiveSync = () => ({ start: vi.fn(), stop: vi.fn() })

        it('starts the live sync of items and item_names with their local and remote DBs', async () => {
            const liveSync = fakeLiveSync()
            provider.liveSync = liveSync
            const syncHooks = { changeSyncState: vi.fn(), refreshData: vi.fn() }
            provider.setSyncHooks(syncHooks)
            await provider.useUserAsync(true, user, vi.fn().mockResolvedValue('token-1'))

            provider.startSync()

            expect(liveSync.start).toHaveBeenCalledTimes(1)
            const [databases, hooks] = liveSync.start.mock.calls[0]
            expect(Object.keys(databases).sort()).toEqual(['item_names', 'items'])
            for (const name of ['items', 'item_names']) {
                expect(databases[name].local).toBe(provider.local[name])
                expect(databases[name].remote).toBe(provider.remote[name])
            }
            expect(databases.items.remote.filter_name).toBe('restrict/restrict')
            expect(databases.items.remote.filter_params).toEqual({ groups: ['user-id'] })
            expect(hooks).toBe(syncHooks)
        })

        it('does not start the sync while logged out', () => {
            const liveSync = fakeLiveSync()
            provider.liveSync = liveSync

            provider.startSync()

            expect(liveSync.start).not.toHaveBeenCalled()
        })

        it('stops the sync before any remote is closed on logout', async () => {
            const liveSync = fakeLiveSync()
            provider.liveSync = liveSync
            await provider.useUserAsync(true, user, vi.fn().mockResolvedValue('token-1'))
            const remote = provider.remote
            const order = []
            liveSync.stop.mockImplementation(() => { order.push('stop sync') })
            for (const name of Object.keys(remote)) {
                remote[name].remote_table.close.mockImplementation(async () => { order.push(`close ${name}`) })
            }

            await provider.Logout()

            expect(liveSync.stop).toHaveBeenCalledTimes(1)
            expect(order[0]).toBe('stop sync')
            expect(order).toHaveLength(5)
        })
    })

    describe('logout teardown', () => {
        const login = async (token = 'token-1') => {
            await provider.useUserAsync(true, user, vi.fn().mockResolvedValue(token))
            return { remote: provider.remote, local: provider.local }
        }

        it('closes all four remotes and destroys all four locals', async () => {
            const { remote, local } = await login()

            await provider.Logout()

            for (const name of ['users', 'items', 'item_names', 'groups']) {
                expect(remote[name].remote_table.close).toHaveBeenCalledTimes(1)
                expect(local[name].destroy).toHaveBeenCalledTimes(1)
            }
            expect(provider.local).toBeUndefined()
            expect(provider.remote).toBeUndefined()
            expect(provider.userId).toBeUndefined()
        })

        it('destroys locals only after the remotes are closed', async () => {
            const { remote, local } = await login()
            const order = []
            for (const name of Object.keys(remote)) {
                remote[name].remote_table.close.mockImplementation(async () => { order.push(`close ${name}`) })
                local[name].destroy.mockImplementation(async () => { order.push(`destroy ${name}`) })
            }

            await provider.Logout()

            expect(order).toHaveLength(8)
            expect(order.slice(0, 4).every((e) => e.startsWith('close'))).toBe(true)
            expect(order.slice(4).every((e) => e.startsWith('destroy'))).toBe(true)
        })

        it('keeps tearing down when a close or a destroy rejects', async () => {
            const { remote, local } = await login()
            remote.items.remote_table.close.mockRejectedValue(new Error('close failed'))
            local.users.destroy.mockRejectedValue(new Error('destroy failed'))
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

            await expect(provider.Logout()).resolves.toBeUndefined()

            expect(remote.item_names.remote_table.close).toHaveBeenCalledTimes(1)
            expect(remote.groups.remote_table.close).toHaveBeenCalledTimes(1)
            for (const name of ['users', 'items', 'item_names', 'groups']) {
                expect(local[name].destroy).toHaveBeenCalledTimes(1)
            }
            expect(warn).toHaveBeenCalled()
            warn.mockRestore()
        })

        it('tears down once on a double or concurrent logout', async () => {
            const { remote, local } = await login()

            await Promise.all([provider.Logout(), provider.Logout()])
            await provider.Logout()

            expect(remote.item_names.remote_table.close).toHaveBeenCalledTimes(1)
            expect(local.items.destroy).toHaveBeenCalledTimes(1)
        })

        it('a login racing a logout keeps its own DBs', async () => {
            const { local: oldLocal } = await login()
            const closing = deferred()
            provider.remote.items.remote_table.close.mockReturnValue(closing.promise)

            const loggingOut = provider.Logout()
            const loggingIn = provider.useUserAsync(true, user, vi.fn().mockResolvedValue('token-2'))
            await Promise.resolve()
            await Promise.resolve()
            // The new session waits for the old teardown to finish.
            expect(provider.logged).toBe(false)

            closing.resolve()
            await Promise.all([loggingOut, loggingIn])

            expect(provider.logged).toBe(true)
            expect(provider.local).not.toBe(oldLocal)
            for (const name of ['users', 'items', 'item_names', 'groups']) {
                expect(oldLocal[name].destroy).toHaveBeenCalledTimes(1)
                expect(provider.local[name].destroy).not.toHaveBeenCalled()
                expect(provider.remote[name].remote_table.close).not.toHaveBeenCalled()
            }
        })
    })
})
