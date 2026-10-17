import { vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, useLocation } from 'react-router';
import { ThemeProvider } from '@mui/material/styles';
import Layout from '../containers/Layout';
import store from '../common/store';
import theme from '../theme';
import { useAuth0 } from '@auth0/auth0-react';

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }));

// The shell is under test, not the routed pages.
vi.mock('../components/RouterSwitch', () => ({
  __esModule: true,
  default: () => <div data-testid="routes" />,
}));

vi.mock('../persistence', () => ({
  __esModule: true,
  default: { UseUser: vi.fn(), onLogin: vi.fn() },
  users: {},
  categories: {},
  itemNames: {},
  items: {},
  groups: {},
}));

const auth0Value = {
  isLoading: false,
  isAuthenticated: false,
  user: undefined,
  getAccessTokenSilently: vi.fn(),
  loginWithRedirect: vi.fn(),
  logout: vi.fn(),
};

const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>;

const renderLayout = (isMobile, auth0 = auth0Value) => {
  vi.mocked(useAuth0).mockReturnValue(auth0);
  return render(
    <MemoryRouter initialEntries={['/welcome']}>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <Layout isMobile={isMobile} />
          <LocationProbe />
        </ThemeProvider>
      </Provider>
    </MemoryRouter>
  );
};

const drawerPaper = (container) => container.querySelector('.MuiDrawer-paper');

beforeEach(() => vi.clearAllMocks());

afterEach(cleanup);

// Closed: a 56px icon rail on desktop, hidden on mobile. Open: the full drawer width.
test.each([
  [false, '56px', '240px'],
  [true, '0px', '150px'],
])('the drawer toggle opens and closes the drawer (mobile: %s)', (isMobile, closedWidth, openWidth) => {
  const { container, getByLabelText } = renderLayout(isMobile);
  const openButton = getByLabelText('open drawer');

  expect(openButton).toBeVisible();
  expect(drawerPaper(container)).toHaveStyle({ width: closedWidth });

  fireEvent.click(openButton);

  expect(openButton).not.toBeVisible();
  expect(drawerPaper(container)).toHaveStyle({ width: openWidth });

  fireEvent.click(getByLabelText('close drawer'));

  expect(openButton).toBeVisible();
  expect(drawerPaper(container)).toHaveStyle({ width: closedWidth });
});

test('renders the app bar title and the navigation entries', () => {
  const { getByText } = renderLayout(false);

  expect(getByText('ExpiGuard')).toBeInTheDocument();
  expect(getByText('Home')).toBeInTheDocument();
  expect(getByText('Browse')).toBeInTheDocument();
  expect(getByText('Add')).toBeInTheDocument();
});

test('the drawer Home and Browse links navigate', () => {
  const { getByText, getByTestId } = renderLayout(false);

  fireEvent.click(getByText('Browse'));
  expect(getByTestId('location')).toHaveTextContent('/items');

  fireEvent.click(getByText('Home'));
  expect(getByTestId('location')).toHaveTextContent(/^\/$/);
});

test('the NavBar Profile menu item navigates to /profile', () => {
  const authenticated = { ...auth0Value, isAuthenticated: true, user: { name: 'Jane', picture: '' } };
  const { getByText, getByTestId, container } = renderLayout(false, authenticated);

  fireEvent.click(container.querySelector('#account_button'));
  fireEvent.click(getByText('Profile'));

  expect(getByTestId('location')).toHaveTextContent('/profile');
});

test('the NavBar Log in button calls loginWithRedirect', () => {
  const { getByText } = renderLayout(false);

  fireEvent.click(getByText('Log in'));

  expect(auth0Value.loginWithRedirect).toHaveBeenCalledTimes(1);
  expect(auth0Value.logout).not.toHaveBeenCalled();
});

test('the NavBar Log out menu item calls logout without arguments', () => {
  const authenticated = { ...auth0Value, isAuthenticated: true, user: { name: 'Jane', picture: '' } };
  const { getByText, container } = renderLayout(false, authenticated);

  fireEvent.click(container.querySelector('#account_button'));
  fireEvent.click(getByText('Log out'));

  expect(auth0Value.logout).toHaveBeenCalledTimes(1);
  expect(auth0Value.logout).toHaveBeenCalledWith();
});
