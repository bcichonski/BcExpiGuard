import { vi } from 'vitest';
import React from 'react';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import Layout from '../containers/Layout';
import store from '../common/store';
import theme from '../theme';
import { Auth0Context } from '../common/auth0';

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
  loading: false,
  isAuthenticated: false,
  user: undefined,
  getTokenSilently: vi.fn(),
  loginWithPopup: vi.fn(),
  loginWithRedirect: vi.fn(),
  logout: vi.fn(),
};

const renderLayout = (isMobile) => render(
  <Auth0Context.Provider value={auth0Value}>
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <Layout isMobile={isMobile} history={{}} />
      </ThemeProvider>
    </Provider>
  </Auth0Context.Provider>
);

const drawerPaper = (container) => container.querySelector('.MuiDrawer-paper');

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
