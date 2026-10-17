import { vi } from 'vitest'
import DbProvider from '../../persistence/DbProvider'

// Keep PouchDB, IndexedDB and the network out: every table is a stub that can be closed.
vi.mock('pouchdb', () => ({
    __esModule: true,
    default: vi.fn(function PouchDB(name) {
        this.name = name
        this.close = vi.fn().mockResolvedValue(undefined)
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
        expect(provider.Login).toHaveBeenCalledWith(user, 'token-1')
        expect(onLoginFn).toHaveBeenCalledTimes(1)
        expect(provider.logged).toBe(true)
        expect(provider.opts.headers.Authorization).toBe('Bearer token-1')
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
        expect(provider.opts.headers.Authorization).toBeUndefined()
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
        await provider.useUserAsync(true, user, vi.fn().mockResolvedValue('token-2'))

        expect(provider.Login).toHaveBeenCalledTimes(2)
        expect(onLoginFn).toHaveBeenCalledTimes(2)
        expect(provider.logged).toBe(true)
        expect(provider.opts.headers.Authorization).toBe('Bearer token-2')
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
        expect(provider.opts.headers.Authorization).toBeUndefined()
    })

    it('lets a new login proceed while a cancelled one is still waiting for its token', async () => {
        const staleToken = deferred()
        const stale = provider.useUserAsync(true, user, () => staleToken.promise)
        await provider.Logout()

        const freshToken = deferred()
        const fresh = provider.useUserAsync(true, user, () => freshToken.promise)

        staleToken.resolve('stale-token')
        await stale
        expect(provider.Login).not.toHaveBeenCalled()

        // The stale login finishing must not drop the fresh one's guard.
        const duplicate = provider.useUserAsync(true, user, vi.fn())
        freshToken.resolve('fresh-token')
        await Promise.all([fresh, duplicate])

        expect(provider.Login).toHaveBeenCalledTimes(1)
        expect(provider.Login).toHaveBeenCalledWith(user, 'fresh-token')
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
})
