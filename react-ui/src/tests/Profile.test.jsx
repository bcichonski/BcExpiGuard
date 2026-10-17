import { vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { useAuth0 } from '@auth0/auth0-react';
import Profile from '../pages/Profile';

vi.mock('@auth0/auth0-react', () => ({ useAuth0: vi.fn() }));

const user = { name: 'Jane Doe', email: 'jane@example.com', picture: 'https://img.test/jane.png' };

const renderProfile = (auth0Value) => {
  vi.mocked(useAuth0).mockReturnValue(auth0Value);
  return render(<Profile />);
};

afterEach(cleanup);

test('shows the user name, email and picture', () => {
  const { getByText, getByAltText } = renderProfile({ isLoading: false, user });

  expect(getByText('Jane Doe')).toBeInTheDocument();
  expect(getByText('jane@example.com')).toBeInTheDocument();
  expect(getByAltText('Profile')).toHaveAttribute('src', user.picture);
});

test('shows a loading state while isLoading', () => {
  const { getByText, queryByText } = renderProfile({ isLoading: true, user });

  expect(getByText('Loading...')).toBeInTheDocument();
  expect(queryByText('Jane Doe')).not.toBeInTheDocument();
});

test('shows a loading state while there is no user', () => {
  const { getByText } = renderProfile({ isLoading: false, user: undefined });

  expect(getByText('Loading...')).toBeInTheDocument();
});
