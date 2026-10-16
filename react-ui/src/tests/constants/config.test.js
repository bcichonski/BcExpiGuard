import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'

const loadConfig = async () => {
    vi.resetModules()
    return import('../../constants/config')
}

describe('constants/config', () => {
    let errorSpy

    beforeEach(() => {
        errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    })

    afterEach(() => {
        errorSpy.mockRestore()
        vi.unstubAllEnvs()
    })

    describe('CouchDB URL normalization', () => {
        it.each([
            ['no trailing slash', 'https://couch.example/db', 'https://couch.example/db/'],
            ['one trailing slash', 'https://couch.example/db/', 'https://couch.example/db/'],
            ['multiple trailing slashes', 'https://couch.example/db///', 'https://couch.example/db/'],
        ])('ends with exactly one slash: %s', async (_name, raw, expected) => {
            vi.stubEnv('VITE_COUCH_URL', raw)
            const config = await loadConfig()
            expect(config.REMOTE_API_ADDRESS).toBe(expected)
            expect(errorSpy).not.toHaveBeenCalled()
        })
    })

    it('exposes the Auth0 settings from the environment', async () => {
        vi.stubEnv('VITE_AUTH0_DOMAIN', 'd.example')
        vi.stubEnv('VITE_AUTH0_CLIENT_ID', 'cid')
        vi.stubEnv('VITE_AUTH0_AUDIENCE', 'aud')
        const config = await loadConfig()
        expect(config.AUTH0_DOMAIN).toBe('d.example')
        expect(config.AUTH0_CLIENT_ID).toBe('cid')
        expect(config.AUTH0_AUDIENCE).toBe('aud')
    })

    describe('missing variables', () => {
        it.each([
            'VITE_COUCH_URL',
            'VITE_AUTH0_DOMAIN',
            'VITE_AUTH0_CLIENT_ID',
            'VITE_AUTH0_AUDIENCE',
        ])('logs a console error naming %s and does not throw', async (name) => {
            vi.stubEnv(name, '')
            await expect(loadConfig()).resolves.toBeDefined()
            expect(errorSpy).toHaveBeenCalledTimes(1)
            expect(errorSpy.mock.calls[0][0]).toContain(name)
        })

        it('leaves the Couch address undefined when VITE_COUCH_URL is missing', async () => {
            vi.stubEnv('VITE_COUCH_URL', '')
            const config = await loadConfig()
            expect(config.REMOTE_API_ADDRESS).toBeFalsy()
        })
    })
})
