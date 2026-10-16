import React from 'react';
import ReactDOM from 'react-dom';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './index.css';
import App from './App';
import { registerSW } from 'virtual:pwa-register';
import { Provider } from 'react-redux'
import store from './common/store'
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE } from "./constants/config";
import { Auth0Provider } from "./common/auth0";
import { createBrowserHistory } from "history";
import syncMonkey from './common/syncMonkey'

const customHistory = createBrowserHistory();

const onRedirectCallback = appState => {
  customHistory.push(
    appState && appState.targetUrl
      ? appState.targetUrl
      : window.location.pathname
  );
};

const wakeUpHook = (fn) => {
  document.addEventListener('mousemove', fn)
  document.addEventListener('touchmove', fn)
}

const wakeUpClean = (fn) => {
  document.removeEventListener('mousemove', fn)
  document.removeEventListener('touchmove', fn)
}

syncMonkey.setWakeUpHooks(wakeUpHook, wakeUpClean)

ReactDOM.render(
  /*<React.StrictMode>*/
  <Auth0Provider
    domain={AUTH0_DOMAIN}
    client_id={AUTH0_CLIENT_ID}
    audience={AUTH0_AUDIENCE}
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

// Registers /service-worker.js (vite-plugin-pwa, auto-update): a new worker activates immediately
// and replaces the previous one, including the worker installed by the former CRA build.
registerSW({ immediate: true });
