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
  appInitialize: (changeSyncStateFn) => dispatch(appActions.initialize(changeSyncStateFn)),
  changeSyncState: (state) => dispatch(appActions.changeSyncState(state))
})

function App(props) {
  const isMobile = useMediaQuery({ maxDeviceWidth: 1000 })
  const { loading, isAuthenticated, user, getTokenSilently } = useAuth0();

  const [appInitialization, setAppInitialization] = useState(false);

  if(!appInitialization) {
    props.appInitialize(props.changeSyncState);

    setAppInitialization(true);
  }

  dbProvider.UseUser(isAuthenticated, user, getTokenSilently)

  if (loading) {
    return <LoadingPanel/>;
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
  history : PropTypes.object
}

export default connect(null, mapDispatchToProps)(App);
