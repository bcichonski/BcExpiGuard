import { vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigationType } from 'react-router';
import { Auth0Provider } from '@auth0/auth0-react';
import Auth0ProviderWithNavigate from '../components/Auth0ProviderWithNavigate';

// The SDK provider is replaced by a pass-through so its props can be inspected without a tenant.
vi.mock('@auth0/auth0-react', () => ({
  Auth0Provider: vi.fn(({ children }) => children),
}));

const LocationProbe = () => (
  <div data-testid="location">{`${useNavigationType()} ${useLocation().pathname}`}</div>
);

const renderProvider = () => render(
  <MemoryRouter initialEntries={['/welcome']}>
    <Auth0ProviderWithNavigate>
      <LocationProbe />
    </Auth0ProviderWithNavigate>
  </MemoryRouter>
);

const providerProps = () => vi.mocked(Auth0Provider).mock.lastCall[0];

beforeEach(() => vi.clearAllMocks());

afterEach(cleanup);

test('passes the env-derived tenant config to Auth0Provider', () => {
  renderProvider();

  const props = providerProps();
  expect(props.domain).toBe('test.auth0.example');
  expect(props.clientId).toBe('test-client-id');
  expect(props.authorizationParams).toEqual({
    redirect_uri: window.location.origin,
    audience: 'https://api.test/',
  });
});

test('keeps the SDK defaults for cache location and refresh tokens', () => {
  renderProvider();

  const props = providerProps();
  expect(props).not.toHaveProperty('cacheLocation');
  expect(props).not.toHaveProperty('useRefreshTokens');
});

test('renders its children', () => {
  const { getByTestId } = renderProvider();

  expect(getByTestId('location')).toHaveTextContent('/welcome');
});

test('onRedirectCallback navigates to appState.targetUrl with replace', () => {
  const { getByTestId } = renderProvider();

  act(() => providerProps().onRedirectCallback({ targetUrl: '/items' }));

  expect(getByTestId('location')).toHaveTextContent('REPLACE /items');
});

test.each([
  ['no appState', undefined],
  ['appState without targetUrl', {}],
])('onRedirectCallback falls back to the current pathname with replace (%s)', (_, appState) => {
  window.history.replaceState({}, '', '/profile?code=abc&state=xyz');
  try {
    const { getByTestId } = renderProvider();

    act(() => providerProps().onRedirectCallback(appState));

    expect(getByTestId('location')).toHaveTextContent('REPLACE /profile');
  } finally {
    window.history.replaceState({}, '', '/');
  }
});
