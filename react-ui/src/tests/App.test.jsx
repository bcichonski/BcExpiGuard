import { StrictMode } from 'react';
import { vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import App from '../App';
import store from '../common/store';
import { useAuth0 } from '@auth0/auth0-react';
import dbProvider from '../persistence';

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }));

// Keep PouchDB and the network out of the smoke test.
vi.mock('../persistence', () => ({
  __esModule: true,
  default: { UseUser: vi.fn(), onLogin: vi.fn(), Logout: vi.fn() },
  users: {},
  categories: {},
  itemNames: {},
  items: {},
  groups: {},
}));

const renderApp = (auth0Value) => {
  vi.mocked(useAuth0).mockReturnValue(auth0Value);
  return render(
    <StrictMode>
      <MemoryRouter>
        <Provider store={store}>
          <App />
        </Provider>
      </MemoryRouter>
    </StrictMode>
  );
};

const auth0Value = (overrides) => ({
  isLoading: false,
  isAuthenticated: false,
  user: undefined,
  getAccessTokenSilently: vi.fn(),
  loginWithRedirect: vi.fn(),
  logout: vi.fn(),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test('renders the app layout for an unauthenticated, not-loading user', () => {
  const { container, queryByRole } = renderApp(auth0Value());

  expect(container.querySelector('.App')).toBeInTheDocument();
  expect(queryByRole('progressbar')).not.toBeInTheDocument();
  expect(container).not.toBeEmptyDOMElement();
});

test('renders the loading panel while auth0 is loading', () => {
  const { container } = renderApp(auth0Value({ isLoading: true }));

  expect(container.querySelector('.App')).not.toBeInTheDocument();
  expect(container.querySelector('svg')).toBeInTheDocument();
});

test('passes the authentication state and getAccessTokenSilently to dbProvider.UseUser', () => {
  const user = { name: 'Jane', email: 'jane@example.com' };
  const value = auth0Value({ isAuthenticated: true, user });

  renderApp(value);

  expect(dbProvider.UseUser).toHaveBeenCalledWith(true, user, value.getAccessTokenSilently);
});

test('registers the login callback before calling dbProvider.UseUser', () => {
  const user = { name: 'Jane', email: 'jane@example.com' };

  renderApp(auth0Value({ isAuthenticated: true, user }));

  expect(dbProvider.onLogin).toHaveBeenCalled();
  expect(dbProvider.onLogin.mock.invocationCallOrder[0])
    .toBeLessThan(dbProvider.UseUser.mock.invocationCallOrder[0]);
});

test('calls dbProvider.UseUser with false when unauthenticated, and makes no dbProvider call during render', () => {
  renderApp(auth0Value());

  // StrictMode mounts effects twice; every call comes from the auth effect, none from render.
  expect(dbProvider.UseUser).toHaveBeenCalledWith(false, undefined, expect.any(Function));
  expect(dbProvider.UseUser).toHaveBeenCalledTimes(dbProvider.onLogin.mock.calls.length);
});

test('shows more elves after 5 s and stops waiting for auth0 after 10 s', () => {
  const { container, queryByText } = renderApp(auth0Value({ isLoading: true }));
  expect(container.querySelector('.App')).not.toBeInTheDocument();
  expect(queryByText(/Waking up more elves/)).not.toBeInTheDocument();

  act(() => { vi.advanceTimersByTime(5 * 1000); });
  expect(queryByText(/Waking up more elves/)).toBeInTheDocument();
  expect(container.querySelector('.App')).not.toBeInTheDocument();

  act(() => { vi.advanceTimersByTime(5 * 1000); });

  expect(container.querySelector('.App')).toBeInTheDocument();
});

// The loading timers are the 5 s and 10 s timeouts; other libraries may schedule their own.
const spyOnLoadingTimers = () => {
  const setSpy = vi.spyOn(globalThis, 'setTimeout');
  const clearSpy = vi.spyOn(globalThis, 'clearTimeout');
  const loadingTimerIds = () => setSpy.mock.calls
    .map((call, i) => ({ delay: call[1], id: setSpy.mock.results[i].value }))
    .filter(({ delay }) => delay === 5 * 1000 || delay === 10 * 1000)
    .map(({ id }) => id);
  const pendingLoadingTimers = () => {
    const cleared = new Set(clearSpy.mock.calls.map((call) => call[0]));
    return loadingTimerIds().filter((id) => !cleared.has(id));
  };
  return { loadingTimerIds, pendingLoadingTimers };
};

test('clears the loading timers on unmount', () => {
  const timers = spyOnLoadingTimers();
  const { unmount } = renderApp(auth0Value({ isLoading: true }));
  // StrictMode mounts the effect twice: the first pair is cleared, one pair stays pending.
  expect(timers.pendingLoadingTimers()).toHaveLength(2);

  unmount();

  expect(timers.loadingTimerIds().length).toBeGreaterThanOrEqual(2);
  expect(timers.pendingLoadingTimers()).toHaveLength(0);
});

test('clears the loading timers once auth0 stops loading', () => {
  const timers = spyOnLoadingTimers();
  const value = auth0Value({ isLoading: true });
  const { rerender, container } = renderApp(value);
  expect(timers.pendingLoadingTimers()).toHaveLength(2);

  vi.mocked(useAuth0).mockReturnValue({ ...value, isLoading: false });
  rerender(
    <StrictMode>
      <MemoryRouter>
        <Provider store={store}>
          <App />
        </Provider>
      </MemoryRouter>
    </StrictMode>
  );

  expect(container.querySelector('.App')).toBeInTheDocument();
  expect(timers.pendingLoadingTimers()).toHaveLength(0);
});
