import { useEffect, useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import Layout from './containers/Layout'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { useAuth0 } from "@auth0/auth0-react";
import LoadingPanel from './components/LoadingPanel'
import NavigationBridge from './components/NavigationBridge'
import dbProvider from './persistence'
import { useDispatch } from 'react-redux';
import { appActions } from './logic/appstate'

function App() {
  const isMobile = useMediaQuery('(max-device-width:1000px)')
  const { isLoading, isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const dispatch = useDispatch()
  const [ignoreLoading, setIgnoreLoading] = useState(false)
  const [useMoreElves, setUseMoreElves] = useState(false)

  // Register the login callback first, so it is in place before UseUser can log in.
  // DbProvider makes login idempotent, so StrictMode's double effect run logs in once.
  useEffect(() => {
    const syncHooks = {
      changeSyncState: (state, key) => dispatch(appActions.changeSyncState(state, key)),
      refreshData: (key) => dispatch(appActions.syncChanges(key)),
    }
    dbProvider.onLogin(() => dispatch(appActions.initialize(syncHooks)))
    dbProvider.UseUser(isAuthenticated, user, getAccessTokenSilently)
  }, [isAuthenticated, user, getAccessTokenSilently, dispatch])

  useEffect(() => {
    if (!isLoading) {
      return undefined
    }
    const moreElvesTimer = setTimeout(() => { setUseMoreElves(true) }, 5 * 1000)
    const ignoreLoadingTimer = setTimeout(() => { setIgnoreLoading(true) }, 10 * 1000)
    return () => {
      clearTimeout(moreElvesTimer)
      clearTimeout(ignoreLoadingTimer)
    }
  }, [isLoading])

  let content
  if (isLoading && !ignoreLoading) {
    content = <LoadingPanel useMoreElves={useMoreElves} />;
  } else {
    content = (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <div className="App">
          <Layout isMobile={isMobile} />
        </div>
      </LocalizationProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NavigationBridge />
      {content}
    </ThemeProvider>
  );
}

export default App;
