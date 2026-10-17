import { useEffect } from 'react'
import { useNavigate } from 'react-router'
import { setNavigate, clearNavigate } from '../common/navigation'

// Registers the router's navigate function for non-component code; renders nothing.
function NavigationBridge() {
  const navigate = useNavigate()

  useEffect(() => {
    setNavigate(navigate)
    return () => clearNavigate()
  }, [navigate])

  return null
}

export default NavigationBridge
