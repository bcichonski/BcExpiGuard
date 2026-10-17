import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './index.css';
import App from './App';
import { registerSW } from 'virtual:pwa-register';
import { Provider } from 'react-redux'
import store from './common/store'
import Auth0ProviderWithNavigate from './components/Auth0ProviderWithNavigate';
import { BrowserRouter } from "react-router";
import syncMonkey from './common/syncMonkey'

const wakeUpHook = (fn) => {
  document.addEventListener('mousemove', fn)
  document.addEventListener('touchmove', fn)
}

const wakeUpClean = (fn) => {
  document.removeEventListener('mousemove', fn)
  document.removeEventListener('touchmove', fn)
}

syncMonkey.setWakeUpHooks(wakeUpHook, wakeUpClean)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Auth0ProviderWithNavigate>
        <Provider store={store}>
          <App />
        </Provider>
      </Auth0ProviderWithNavigate>
    </BrowserRouter>
  </StrictMode>
);

// Registers /service-worker.js (vite-plugin-pwa, auto-update): a new worker activates immediately
// and replaces the previous one, including the worker installed by the former CRA build.
registerSW({ immediate: true });
