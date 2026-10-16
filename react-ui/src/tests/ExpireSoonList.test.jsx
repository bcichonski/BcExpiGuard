import { vi } from 'vitest';
import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import ExpireSoonList from '../components/ExpireSoonList';
import { itemTypes } from '../logic/item-list';
import theme from '../theme';

const items = [
  { id: '1', name: 'Milk', quantity: '2', unit: 'l', datedescript: 'today', state: itemTypes.ITEM_ACTIVE },
  { id: '2', name: 'Bread', quantity: '1', unit: 'pcs', datedescript: '2 days ago', state: itemTypes.ITEM_DONE },
];

const mockViewport = (mobile) => {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: mobile,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }));
};

const renderList = (props) => render(
  <ThemeProvider theme={theme}>
    <ExpireSoonList title="Soon" items={items} showHeader handleRemove={vi.fn()} handleUndo={vi.fn()} {...props} />
  </ThemeProvider>
);

afterEach(() => {
  cleanup();
  delete window.matchMedia;
});

test('done items are struck through and active ones are not', () => {
  mockViewport(false);
  const { getByText } = renderList();

  expect(getByText('Bread').closest('tr')).toHaveStyle({ textDecorationLine: 'line-through' });
  expect(getByText('Milk').closest('tr')).not.toHaveStyle({ textDecorationLine: 'line-through' });
});

test('desktop shows the full column labels', () => {
  mockViewport(false);
  const { getByText, queryByText } = renderList();

  expect(getByText('Quantity')).toBeInTheDocument();
  expect(getByText('Expiration')).toBeInTheDocument();
  expect(queryByText('Qt.')).not.toBeInTheDocument();
  expect(queryByText('Exp.')).not.toBeInTheDocument();
});

test('mobile shows the short column labels', () => {
  mockViewport(true);
  const { getByText, queryByText } = renderList();

  expect(getByText('Qt.')).toBeInTheDocument();
  expect(getByText('Exp.')).toBeInTheDocument();
  expect(queryByText('Quantity')).not.toBeInTheDocument();
  expect(queryByText('Expiration')).not.toBeInTheDocument();
});

test('the header is omitted when showHeader is false', () => {
  mockViewport(false);
  const { queryByText } = renderList({ showHeader: false });

  expect(queryByText('Name')).not.toBeInTheDocument();
});

test('renders the rows with their values', () => {
  mockViewport(false);
  const { getByText } = renderList();

  expect(getByText('Soon')).toBeInTheDocument();
  expect(getByText('Milk')).toBeInTheDocument();
  expect(getByText('2 days ago')).toBeInTheDocument();
});
