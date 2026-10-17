import { vi } from 'vitest'
import { navigate, setNavigate, clearNavigate } from '../../common/navigation'

describe('navigation bridge', () => {
    afterEach(() => {
        clearNavigate()
        vi.restoreAllMocks()
    })

    it('delegates to the registered navigate function', () => {
        const fn = vi.fn()
        setNavigate(fn)

        navigate('/items', { replace: true })

        expect(fn).toHaveBeenCalledWith('/items', { replace: true })
    })

    it('is a safe no-op before registration', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})

        expect(() => navigate('/items')).not.toThrow()
    })

    it('is a no-op again after the registration is cleared', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        const fn = vi.fn()
        setNavigate(fn)
        clearNavigate()

        navigate('/items')

        expect(fn).not.toHaveBeenCalled()
    })
})
