import { vi } from 'vitest'
import PouchDB from 'pouchdb'
import { createAuthFetch } from '../../persistence/authFetch'

const URL = 'https://couch.example/items/_changes'

const respond = (status) => new Response(JSON.stringify({ status }), { status })

const authHeaderOf = (call) => new Headers(call[1].headers).get('Authorization')

describe('createAuthFetch', () => {
    let fetchSpy

    beforeEach(() => {
        fetchSpy = vi.spyOn(PouchDB, 'fetch')
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('attaches a token per request and picks up a changed token on the next request', async () => {
        fetchSpy.mockImplementation(async () => respond(200))
        const getToken = vi.fn()
            .mockResolvedValueOnce('token-1')
            .mockResolvedValueOnce('token-2')
        const authFetch = createAuthFetch({ getToken })

        await authFetch(URL, { method: 'GET', headers: new Headers({ Accept: 'application/json' }) })
        await authFetch(URL, { method: 'GET' })

        expect(getToken).toHaveBeenCalledTimes(2)
        expect(fetchSpy).toHaveBeenCalledTimes(2)
        expect(authHeaderOf(fetchSpy.mock.calls[0])).toBe('Bearer token-1')
        expect(new Headers(fetchSpy.mock.calls[0][1].headers).get('Accept')).toBe('application/json')
        expect(fetchSpy.mock.calls[0][1].method).toBe('GET')
        expect(authHeaderOf(fetchSpy.mock.calls[1])).toBe('Bearer token-2')
    })

    it('refreshes the token with the cache off and retries once after a 401', async () => {
        fetchSpy
            .mockResolvedValueOnce(respond(401))
            .mockResolvedValueOnce(respond(200))
        const getToken = vi.fn(async (opts) => (opts?.cacheMode === 'off' ? 'fresh-token' : 'expired-token'))
        const authFetch = createAuthFetch({ getToken })

        const response = await authFetch(URL, { method: 'POST', body: '{"a":1}' })

        expect(response.status).toBe(200)
        expect(getToken).toHaveBeenCalledTimes(2)
        expect(getToken).toHaveBeenLastCalledWith({ cacheMode: 'off' })
        expect(fetchSpy).toHaveBeenCalledTimes(2)
        expect(authHeaderOf(fetchSpy.mock.calls[0])).toBe('Bearer expired-token')
        expect(authHeaderOf(fetchSpy.mock.calls[1])).toBe('Bearer fresh-token')
        expect(fetchSpy.mock.calls[1][1].body).toBe('{"a":1}')
    })

    it('surfaces the 401 when the retry is rejected too, without looping', async () => {
        fetchSpy.mockImplementation(async () => respond(401))
        const getToken = vi.fn().mockResolvedValue('token')
        const authFetch = createAuthFetch({ getToken })

        const response = await authFetch(URL, {})

        expect(response.status).toBe(401)
        expect(fetchSpy).toHaveBeenCalledTimes(2)
        expect(getToken).toHaveBeenCalledTimes(2)
    })

    it('returns the 401 when the forced token refresh fails', async () => {
        fetchSpy.mockImplementation(async () => respond(401))
        const getToken = vi.fn()
            .mockResolvedValueOnce('expired-token')
            .mockRejectedValueOnce(new Error('login_required'))
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const authFetch = createAuthFetch({ getToken })

        const response = await authFetch(URL, {})

        expect(response.status).toBe(401)
        expect(fetchSpy).toHaveBeenCalledTimes(1)
        expect(warn).toHaveBeenCalled()
    })

    it('surfaces a token failure without sending the request', async () => {
        const getToken = vi.fn().mockRejectedValue(new Error('login_required'))
        const authFetch = createAuthFetch({ getToken })

        await expect(authFetch(URL, {})).rejects.toThrow('login_required')
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('fails fast without requesting a token once the session has ended', async () => {
        const getToken = vi.fn().mockResolvedValue('token')
        const session = { getToken }
        const authFetch = createAuthFetch(session)

        session.getToken = null

        await expect(authFetch(URL, {})).rejects.toThrow(/logout/)
        expect(getToken).not.toHaveBeenCalled()
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('does not send a request whose token arrived after the session ended', async () => {
        const session = {}
        session.getToken = vi.fn(async () => {
            session.getToken = null
            return 'token'
        })
        const authFetch = createAuthFetch(session)

        await expect(authFetch(URL, {})).rejects.toThrow(/logout/)
        expect(fetchSpy).not.toHaveBeenCalled()
    })

    it('does not retry a 401 once the session ended during the refresh', async () => {
        fetchSpy.mockImplementation(async () => respond(401))
        const session = {}
        const getToken = vi.fn(async (opts) => {
            if (opts) {
                session.getToken = null
            }
            return 'token'
        })
        session.getToken = getToken
        const authFetch = createAuthFetch(session)

        const response = await authFetch(URL, {})

        expect(response.status).toBe(401)
        expect(fetchSpy).toHaveBeenCalledTimes(1)
    })
})

describe('PouchDB 9 remote fetch option', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('routes remote requests through the wrapper with a bearer token', async () => {
        const fetchSpy = vi.spyOn(PouchDB, 'fetch').mockImplementation(
            async () => new Response(JSON.stringify({ db_name: 'items', doc_count: 0 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            }))
        const getToken = vi.fn().mockResolvedValue('token-1')
        const remote = new PouchDB('https://couch.example/items', { fetch: createAuthFetch({ getToken }) })

        await remote.info()

        expect(fetchSpy).toHaveBeenCalled()
        for (const call of fetchSpy.mock.calls) {
            expect(authHeaderOf(call)).toBe('Bearer token-1')
        }
        await remote.close()
    })
})
