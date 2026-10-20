import { vi } from 'vitest'
import logger, { isDebugEnabled } from '../../common/logger'

describe('logger', () => {
    beforeEach(() => {
        vi.spyOn(console, 'debug').mockImplementation(() => {})
        vi.spyOn(console, 'info').mockImplementation(() => {})
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        vi.spyOn(console, 'error').mockImplementation(() => {})
        localStorage.clear()
    })

    afterEach(() => {
        vi.unstubAllEnvs()
        vi.restoreAllMocks()
    })

    it('emits debug and info when DEV is on', () => {
        vi.stubEnv('DEV', true)
        logger.debug('d')
        logger.info('i')
        expect(console.debug).toHaveBeenCalledWith('d')
        expect(console.info).toHaveBeenCalledWith('i')
    })

    it('suppresses debug and info when DEV is off and the flag is unset', () => {
        vi.stubEnv('DEV', false)
        expect(isDebugEnabled()).toBe(false)
        logger.debug('d')
        logger.info('i')
        expect(console.debug).not.toHaveBeenCalled()
        expect(console.info).not.toHaveBeenCalled()
    })

    it('emits debug when DEV is off but the localStorage flag is "1"', () => {
        vi.stubEnv('DEV', false)
        localStorage.setItem('expiguard:debug', '1')
        logger.debug('d')
        expect(console.debug).toHaveBeenCalledWith('d')
    })

    it('ignores other flag values', () => {
        vi.stubEnv('DEV', false)
        localStorage.setItem('expiguard:debug', 'true')
        expect(isDebugEnabled()).toBe(false)
    })

    it('treats a throwing localStorage as debug off', () => {
        vi.stubEnv('DEV', false)
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
        expect(isDebugEnabled()).toBe(false)
        logger.debug('d')
        expect(console.debug).not.toHaveBeenCalled()
    })

    it('always emits warn and error', () => {
        vi.stubEnv('DEV', false)
        logger.warn('w')
        logger.error('e')
        expect(console.warn).toHaveBeenCalledWith('w')
        expect(console.error).toHaveBeenCalledWith('e')
    })
})
