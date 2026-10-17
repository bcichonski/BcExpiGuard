// Module-level navigation bridge: lets non-component code (Redux reducers/thunks) navigate
// through React Router. NavigationBridge registers the router's navigate function.
let navigateFn = null

export const setNavigate = (fn) => {
  navigateFn = fn
}

export const clearNavigate = () => {
  navigateFn = null
}

export const navigate = (to, options) => {
  if (!navigateFn) {
    if (import.meta.env.DEV) {
      console.warn(`navigate('${to}') ignored: the router is not mounted yet`)
    }
    return
  }
  return navigateFn(to, options)
}
