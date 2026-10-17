import { StrictMode } from 'react';
import { vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';
import App from '../App';
import store from '../common/store';
import { useAuth0 } from '@auth0/auth0-react';

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

const user = { name: 'Jane', email: 'jane@example.com', picture: 'https://example.com/jane.png' };

let errorSpy;
let warnSpy;

beforeEach(() => {
  vi.mocked(useAuth0).mockReturnValue({
    isLoading: false,
    isAuthenticated: true,
    user,
    getAccessTokenSilently: vi.fn().mockResolvedValue('token'),
    loginWithRedirect: vi.fn(),
    logout: vi.fn(),
  });
  errorSpy = vi.spyOn(console, 'error');
  warnSpy = vi.spyOn(console, 'warn');
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

test.each(['/', '/items', '/item/add', '/item/edit', '/profile', '/welcome'])(
  '%s renders under StrictMode without console errors or warnings',
  async (path) => {
    const { container } = render(
      <StrictMode>
        <MemoryRouter initialEntries={[path]}>
          <Provider store={store}>
            <App />
          </Provider>
        </MemoryRouter>
      </StrictMode>
    );
    await act(async () => {});

    expect(container).not.toBeEmptyDOMElement();
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  }
);
