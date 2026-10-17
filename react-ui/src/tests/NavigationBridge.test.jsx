import { render, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import NavigationBridge from '../components/NavigationBridge';
import { navigate } from '../common/navigation';
import { act } from 'react';

const LocationProbe = () => <div data-testid="location">{useLocation().pathname}</div>;

afterEach(cleanup);

test('registers the router navigate function while mounted and clears it on unmount', () => {
  const { getByTestId, unmount } = render(
    <MemoryRouter>
      <NavigationBridge />
      <LocationProbe />
    </MemoryRouter>
  );

  act(() => navigate('/items'));
  expect(getByTestId('location')).toHaveTextContent('/items');

  unmount();
  expect(() => navigate('/other')).not.toThrow();
});
