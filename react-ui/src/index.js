import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import { Provider } from 'react-redux'
import store from './common/store'
import config from "./constants/auth_config.json";
import { Auth0Provider } from "./common/auth0";
import { createBrowserHistory } from "history";

const customHistory = createBrowserHistory();

const onRedirectCallback = appState => {
  // eslint-disable-next-line
  customHistory.push(
    appState && appState.targetUrl
      ? appState.targetUrl
      : window.location.pathname
  );
};

ReactDOM.render(
  /*<React.StrictMode>*/
  <Auth0Provider
    domain={config.domain}
    client_id={config.clientId}
    redirect_uri={window.location.origin}
    onRedirectCallback={onRedirectCallback}
  >
    <Provider store={store}>
      <App history={customHistory}/>
    </Provider>
  </Auth0Provider>
  /*</React.StrictMode>*/,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
