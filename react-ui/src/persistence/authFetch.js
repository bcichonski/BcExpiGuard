import PouchDB from 'pouchdb';
import logger from '../common/logger'

// Auth0 SDK option that bypasses its token cache (GetTokenSilentlyOptions.cacheMode).
export const FORCE_REFRESH = { cacheMode: 'off' }

const withBearer = (options, token) => {
    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${token}`)
    return { ...options, headers }
}

// Builds the `fetch` option of a remote PouchDB. Every request asks the session's token getter
// (the Auth0 SDK's getAccessTokenSilently) for a token, so an expired token is never reused (#22).
// On a 401 the token is fetched once more with the SDK cache off and the request is retried once (D7).
// Once the session ends (logout clears session.getToken) requests fail fast without asking for a token.
export function createAuthFetch(session) {
    return async function authFetch(url, options = {}) {
        const getToken = session.getToken
        if (!getToken) {
            throw new Error('Remote request after logout: no token getter')
        }

        const token = await getToken()
        if (session.getToken !== getToken) {
            throw new Error('Remote request after logout: session ended')
        }
        const response = await PouchDB.fetch(url, withBearer(options, token))
        if (response.status !== 401) {
            return response
        }

        let freshToken
        try {
            freshToken = await getToken(FORCE_REFRESH)
        } catch (err) {
            logger.warn('Remote request: token refresh after 401 failed', err)
            return response
        }
        if (session.getToken !== getToken) {
            // Logged out while refreshing: never retry on behalf of an ended session.
            return response
        }
        return PouchDB.fetch(url, withBearer(options, freshToken))
    }
}
