import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import App from '../App';
import store from '../common/store';
import { Auth0Context } from '../common/auth0';

// Keep PouchDB and the network out of the smoke test.
jest.mock('../persistence', () => ({
  __esModule: true,
  default: { UseUser: jest.fn(), onLogin: jest.fn() },
  users: {},
  categories: {},
  itemNames: {},
  items: {},
  groups: {},
}));

const renderApp = (auth0Value) => render(
  <Auth0Context.Provider value={auth0Value}>
    <Provider store={store}>
      <App history={{}} />
    </Provider>
  </Auth0Context.Provider>
);

const auth0Value = (overrides) => ({
  loading: false,
  isAuthenticated: false,
  user: undefined,
  getTokenSilently: jest.fn(),
  loginWithPopup: jest.fn(),
  loginWithRedirect: jest.fn(),
  logout: jest.fn(),
  ...overrides,
});

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  cleanup();
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('renders the app layout for an unauthenticated, not-loading user', () => {
  const { container, queryByRole } = renderApp(auth0Value());

  expect(container.querySelector('.App')).toBeInTheDocument();
  expect(queryByRole('progressbar')).not.toBeInTheDocument();
  expect(container).not.toBeEmpty();
});

test('renders the loading panel while auth0 is loading', () => {
  const { container } = renderApp(auth0Value({ loading: true }));

  expect(container.querySelector('.App')).not.toBeInTheDocument();
  expect(container.querySelector('svg')).toBeInTheDocument();
});
