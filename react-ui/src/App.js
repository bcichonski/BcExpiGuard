import React, { useState } from 'react';
import { useMediaQuery } from 'react-responsive'
import Layout from './containers/Layout'
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { useAuth0 } from "./common/auth0";
import PropTypes from 'prop-types';
import LoadingPanel from './components/LoadingPanel'
import dbProvider from './persistence'
import { connect } from 'react-redux';
import { appActions } from './logic/appstate'

const mapDispatchToProps = (dispatch) => ({
  appInitialize: (syncHooks) => dispatch(appActions.initialize(syncHooks)),
  changeSyncState: (state, key) => dispatch(appActions.changeSyncState(state, key)),
  refreshData: (key) => dispatch(appActions.syncChanges(key)),
})

function App(props) {
  const isMobile = useMediaQuery({ maxDeviceWidth: 1000 })
  const { loading, isAuthenticated, user, getTokenSilently } = useAuth0();
  const [ignoreLoading, setIgnoreLoading] = useState(false)
  const [appInitialization, setAppInitialization] = useState(false);
  const [useMoreElves, setUseMoreElves] = useState(false)

  if (!appInitialization) {
    props.appInitialize({ changeSyncState: props.changeSyncState, refreshData: props.refreshData });

    setAppInitialization(true);
  }

  dbProvider.UseUser(isAuthenticated, user, getTokenSilently)

  if (loading && !ignoreLoading) {
    setTimeout(() => { setIgnoreLoading(true) }, 10 * 1000)
    setTimeout(() => { setUseMoreElves(true) }, 5 * 1000);
    return <LoadingPanel useMoreElves={useMoreElves} />;
  }

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <div className="App">
        <Layout isMobile={isMobile} history={props.history} />
      </div>
    </MuiPickersUtilsProvider>
  );
}

App.propTypes = {
  history: PropTypes.object
}

export default connect(null, mapDispatchToProps)(App);
