import React, { useState } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import Layout from './containers/Layout'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV2';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import { useAuth0 } from "./common/auth0";
import PropTypes from 'prop-types';
import LoadingPanel from './components/LoadingPanel'
import dbProvider from './persistence'
import { connect } from 'react-redux';
import { appActions } from './logic/appstate'

const mapDispatchToProps = (dispatch) => ({
  appInitialize: (syncHooks) => dbProvider.onLogin(() => dispatch(appActions.initialize(syncHooks))),
  changeSyncState: (state, key) => dispatch(appActions.changeSyncState(state, key)),
  refreshData: (key) => dispatch(appActions.syncChanges(key)),
})

function App(props) {
  const isMobile = useMediaQuery('(max-device-width:1000px)')
  const { loading, isAuthenticated, user, getTokenSilently } = useAuth0();
  const [ignoreLoading, setIgnoreLoading] = useState(false)
  const [appInitialization, setAppInitialization] = useState(false);
  const [useMoreElves, setUseMoreElves] = useState(false)

  if (isAuthenticated) {
    if (!appInitialization) {
      props.appInitialize({ changeSyncState: props.changeSyncState, refreshData: props.refreshData });
      setAppInitialization(true);
    }
  } else {
    if (appInitialization) {
      setAppInitialization(false);
    }
  }

  dbProvider.UseUser(isAuthenticated, user, getTokenSilently)

  let content
  if (loading && !ignoreLoading) {
    setTimeout(() => { setIgnoreLoading(true) }, 10 * 1000)
    setTimeout(() => { setUseMoreElves(true) }, 5 * 1000);
    content = <LoadingPanel useMoreElves={useMoreElves} />;
  } else {
    content = (
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <div className="App">
          <Layout isMobile={isMobile} history={props.history} />
        </div>
      </LocalizationProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {content}
    </ThemeProvider>
  );
}

App.propTypes = {
  history: PropTypes.object
}

export default connect(null, mapDispatchToProps)(App);
