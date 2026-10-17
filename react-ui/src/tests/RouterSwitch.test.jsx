import { vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import RouterSwitch from '../components/RouterSwitch';
import { useAuth0 } from '@auth0/auth0-react';

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }));

vi.mock('../pages/MainContent', () => ({ __esModule: true, default: () => <div>page-main</div> }));
vi.mock('../pages/AddItem', () => ({ __esModule: true, default: () => <div>page-add</div> }));
vi.mock('../pages/BrowseItems', () => ({ __esModule: true, default: () => <div>page-browse</div> }));
vi.mock('../pages/Profile', () => ({ __esModule: true, default: () => <div>page-profile</div> }));
vi.mock('../pages/LandingPage', () => ({ __esModule: true, default: () => <div>page-welcome</div> }));

const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>;

const renderAt = (path, isAuthenticated) => {
  vi.mocked(useAuth0).mockReturnValue({ isAuthenticated, isLoading: false });
  return render(
    <MemoryRouter initialEntries={[path]}>
      <RouterSwitch />
      <LocationProbe />
    </MemoryRouter>
  );
};

afterEach(cleanup);

const restricted = [
  ['/', 'page-main'],
  ['/items', 'page-browse'],
  ['/item/add', 'page-add'],
  ['/item/edit', 'page-add'],
  ['/profile', 'page-profile'],
];

test.each(restricted)('%s renders its page when authenticated', (path, text) => {
  const { getByText, getByTestId } = renderAt(path, true);

  expect(getByText(text)).toBeInTheDocument();
  expect(getByTestId('location')).toHaveTextContent(path);
});

test.each(restricted)('%s redirects to /welcome when not authenticated', (path, text) => {
  const { getByText, queryByText, getByTestId } = renderAt(path, false);

  expect(queryByText(text)).not.toBeInTheDocument();
  expect(getByText('page-welcome')).toBeInTheDocument();
  expect(getByTestId('location')).toHaveTextContent('/welcome');
});

test.each([true, false])('/welcome is public (authenticated: %s)', (isAuthenticated) => {
  const { getByText } = renderAt('/welcome', isAuthenticated);

  expect(getByText('page-welcome')).toBeInTheDocument();
});

test('an unknown path renders nothing', () => {
  const { container } = renderAt('/nope', true);

  expect(container.querySelector('[data-testid="location"]')).toBeInTheDocument();
  expect(container).toHaveTextContent('/nope');
  expect(container).not.toHaveTextContent('page-');
});
