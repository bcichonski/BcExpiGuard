import { StrictMode } from 'react';
import { vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import App from '../App';
import store from '../common/store';
import { useAuth0 } from '@auth0/auth0-react';
import dbProvider from '../persistence';
import { appActions } from '../logic/appstate';

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }));

// A real DbProvider (so its login guard is exercised) over stubbed PouchDB tables.
vi.mock('pouchdb', () => ({
  __esModule: true,
  default: vi.fn(function PouchDB(name) {
    this.name = name;
    this.close = vi.fn().mockResolvedValue(undefined);
  }),
}));

vi.mock('../persistence/users', () => ({
  __esModule: true,
  default: { getId: vi.fn(() => 'user-id'), add: vi.fn() },
}));

vi.mock('../persistence', async () => {
  const { default: DbProvider } = await vi.importActual('../persistence/DbProvider');
  return {
    __esModule: true,
    default: new DbProvider(),
    users: {},
    categories: {},
    itemNames: {},
    items: {},
    groups: {},
  };
});

const user = { name: 'Jane', email: 'jane@example.com' };

const auth0Value = (overrides) => ({
  isLoading: false,
  isAuthenticated: false,
  user: undefined,
  getAccessTokenSilently: vi.fn().mockResolvedValue('token-1'),
  loginWithRedirect: vi.fn(),
  logout: vi.fn(),
  ...overrides,
});

const app = () => (
  <StrictMode>
    <MemoryRouter>
      <Provider store={store}>
        <App />
      </Provider>
    </MemoryRouter>
  </StrictMode>
);

// Lets the async login (token promise, then Login) settle inside act.
const flushLogin = () => act(async () => {});

let errorSpy;
let warnSpy;

beforeEach(async () => {
  vi.clearAllMocks();
  await dbProvider.Logout();
  vi.spyOn(dbProvider, 'Login');
  vi.spyOn(dbProvider, 'Logout');
  vi.spyOn(appActions, 'initialize').mockReturnValue({ type: 'test/initialize' });
  errorSpy = vi.spyOn(console, 'error');
  warnSpy = vi.spyOn(console, 'warn');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test('logs in and initializes once under StrictMode, without console warnings', async () => {
  const value = auth0Value({ isAuthenticated: true, user });
  vi.mocked(useAuth0).mockReturnValue(value);

  render(app());
  await flushLogin();

  expect(value.getAccessTokenSilently).toHaveBeenCalledTimes(1);
  expect(dbProvider.Login).toHaveBeenCalledTimes(1);
  expect(dbProvider.Login).toHaveBeenCalledWith(user, 'token-1');
  expect(appActions.initialize).toHaveBeenCalledTimes(1);
  expect(appActions.initialize).toHaveBeenCalledWith({
    changeSyncState: expect.any(Function),
    refreshData: expect.any(Function),
  });
  expect(dbProvider.logged).toBe(true);
  expect(errorSpy).not.toHaveBeenCalled();
  expect(warnSpy).not.toHaveBeenCalled();
});

test('logs out when the user is no longer authenticated', async () => {
  const value = auth0Value({ isAuthenticated: true, user });
  vi.mocked(useAuth0).mockReturnValue(value);
  const { rerender } = render(app());
  await flushLogin();
  expect(dbProvider.logged).toBe(true);

  vi.mocked(useAuth0).mockReturnValue({ ...value, isAuthenticated: false, user: undefined });
  rerender(app());
  await flushLogin();

  expect(dbProvider.Logout).toHaveBeenCalled();
  expect(dbProvider.logged).toBe(false);
  expect(dbProvider.Login).toHaveBeenCalledTimes(1);
  expect(appActions.initialize).toHaveBeenCalledTimes(1);
  expect(errorSpy).not.toHaveBeenCalled();
  expect(warnSpy).not.toHaveBeenCalled();
});

test('does not log in while unauthenticated', async () => {
  vi.mocked(useAuth0).mockReturnValue(auth0Value());

  render(app());
  await flushLogin();

  expect(dbProvider.Login).not.toHaveBeenCalled();
  expect(appActions.initialize).not.toHaveBeenCalled();
  expect(dbProvider.logged).toBe(false);
  expect(errorSpy).not.toHaveBeenCalled();
  expect(warnSpy).not.toHaveBeenCalled();
});
