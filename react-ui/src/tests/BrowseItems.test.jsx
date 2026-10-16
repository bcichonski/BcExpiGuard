import { vi } from 'vitest';
import React from 'react';
import { render, cleanup, fireEvent, within, wait } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { ThemeProvider } from '@mui/material/styles';
import BrowseItems from '../pages/BrowseItems';
import { itemActions, itemTypes } from '../logic/item-list';
import { itemEditActions } from '../logic/item-edit-add';
import theme from '../theme';

vi.mock('../persistence', () => ({
  __esModule: true,
  default: { UseUser: vi.fn(), onLogin: vi.fn() },
  users: {},
  categories: {},
  itemNames: {},
  items: {},
  groups: {},
}));

vi.mock('../common/syncMonkey', () => ({
  __esModule: true,
  default: { reset: vi.fn() },
}));

// jsdom has no layout, so the grid would measure a zero-sized viewport and render no rows.
vi.mock('@mui/x-data-grid', async (importOriginal) => {
  const actual = await importOriginal();
  const DataGrid = (props) => <actual.DataGrid {...props} disableVirtualization />;
  return { ...actual, DataGrid };
});

const names = [
  { id: 'n-milk', name: 'Milk' },
  { id: 'n-bread', name: 'Bread' },
  { id: 'n-cheese', name: 'Cheese' },
  { id: 'n-eggs', name: 'Eggs' },
];

const items = [
  { id: 'i1', nameID: 'n-milk', quantity: '2', unit: 'l', date: '2026-10-17', state: itemTypes.ITEM_ACTIVE },
  { id: 'i2', nameID: 'n-eggs', quantity: '10', unit: 'pcs', date: '2026-10-28', state: itemTypes.ITEM_ACTIVE },
  { id: 'i3', nameID: 'n-bread', quantity: '1', unit: 'pcs', date: '2026-10-16', state: itemTypes.ITEM_DONE },
  { id: 'i4', nameID: 'n-cheese', quantity: '250', unit: 'g', date: '2026-10-22', state: itemTypes.ITEM_REMOVED },
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

let dispatched;

const renderBrowse = (mobile = false) => {
  mockViewport(mobile);
  dispatched = [];
  const store = createStore((state = { itemReducer: items, itemNameReducer: names }, action) => {
    dispatched.push(action);
    return state;
  });
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <BrowseItems />
      </ThemeProvider>
    </Provider>
  );
};

const gridRows = (container) => Array.from(container.querySelectorAll('.MuiDataGrid-row'));
const rowNames = (container) => gridRows(container).map((row) => row.querySelector('[data-field="name"]').textContent);
const rowOf = (container, name) => gridRows(container).find((row) => within(row).queryByText(name));

const filterSelect = () => document.querySelector('#main-filter');

const chooseFilter = (label) => {
  fireEvent.mouseDown(filterSelect());
  fireEvent.click(within(document.querySelector('[role=listbox]')).getByText(label));
};

beforeEach(() => {
  vi.spyOn(itemActions, 'removeItem').mockImplementation((id) => ({ type: 'test/remove', id }));
  vi.spyOn(itemActions, 'updateItemQuantity').mockImplementation((item, value) => ({ type: 'test/quantity', item, value }));
  vi.spyOn(itemEditActions, 'itemInEdit').mockImplementation((item) => ({ type: 'test/edit', item }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  delete window.matchMedia;
});

test('the default Active filter shows only active items, with resolved names', () => {
  const { container } = renderBrowse();

  expect(filterSelect()).toHaveTextContent('Active');
  expect(rowNames(container)).toEqual(['Milk', 'Eggs']);
});

test.each([
  ['Done', ['Bread']],
  ['Deleted', ['Cheese']],
  ['None', ['Milk', 'Eggs', 'Bread', 'Cheese']],
])('switching the filter to %s changes the rows', (label, expected) => {
  const { container } = renderBrowse();

  chooseFilter(label);

  expect(rowNames(container)).toEqual(expected);
});

test('the quick filter narrows the rows by name', async () => {
  const { container, getByLabelText } = renderBrowse();
  chooseFilter('None');

  fireEvent.change(getByLabelText('Search'), { target: { value: 'che' } });

  await wait(() => expect(rowNames(container)).toEqual(['Cheese']));
});

test('columns sort when the header is clicked', async () => {
  const { container, getByText } = renderBrowse();

  fireEvent.click(getByText('Name'));

  await wait(() => expect(rowNames(container)).toEqual(['Eggs', 'Milk']));
});

test('desktop shows the three row actions and the full column labels', () => {
  const { container, getByText, queryByLabelText } = renderBrowse(false);
  const row = rowOf(container, 'Milk');

  expect(within(row).getByLabelText('Delete')).toBeInTheDocument();
  expect(within(row).getByLabelText('Edit')).toBeInTheDocument();
  expect(within(row).getByLabelText('Dealt with')).toBeInTheDocument();
  expect(queryByLabelText('Actions')).not.toBeInTheDocument();
  expect(getByText('Quantity')).toBeInTheDocument();
  expect(getByText('Expiration date')).toBeInTheDocument();
});

test('mobile shows a single menu action and the short column labels', () => {
  const { container, getByText, queryByText } = renderBrowse(true);
  const row = rowOf(container, 'Milk');

  expect(within(row).getByLabelText('Actions')).toBeInTheDocument();
  expect(within(row).queryByLabelText('Delete')).not.toBeInTheDocument();
  expect(getByText('Qt.')).toBeInTheDocument();
  expect(getByText('Exp.')).toBeInTheDocument();
  expect(queryByText('Quantity')).not.toBeInTheDocument();
});

test('Delete then confirm dispatches removeItem with the row id', () => {
  const { container, getByText } = renderBrowse(false);

  fireEvent.click(within(rowOf(container, 'Eggs')).getByLabelText('Delete'));
  fireEvent.click(getByText('OK'));

  expect(itemActions.removeItem).toHaveBeenCalledWith('i2');
  expect(dispatched).toContainEqual({ type: 'test/remove', id: 'i2' });
});

test('Delete then cancel dispatches nothing', () => {
  const { container, getByText } = renderBrowse(false);

  fireEvent.click(within(rowOf(container, 'Eggs')).getByLabelText('Delete'));
  fireEvent.click(getByText('Cancel'));

  expect(itemActions.removeItem).not.toHaveBeenCalled();
});

test('Edit dispatches itemInEdit with the row', () => {
  const { container } = renderBrowse(false);

  fireEvent.click(within(rowOf(container, 'Milk')).getByLabelText('Edit'));

  expect(itemEditActions.itemInEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'i1', nameID: 'n-milk', name: 'Milk' }));
});

test('Dealt with opens the quantity dialog and dispatches updateItemQuantity for the row', () => {
  const { container, getByText } = renderBrowse(false);

  fireEvent.click(within(rowOf(container, 'Eggs')).getByLabelText('Dealt with'));
  fireEvent.click(getByText('All 10 pcss'));

  expect(itemActions.updateItemQuantity).toHaveBeenCalledWith(expect.objectContaining({ id: 'i2' }), 'all');
});

test('the mobile menu runs the chosen action for its row', () => {
  const { container, getByText } = renderBrowse(true);

  fireEvent.click(within(rowOf(container, 'Milk')).getByLabelText('Actions'));
  fireEvent.click(within(document.querySelector('#actions-menu')).getByText('Edit'));

  expect(itemEditActions.itemInEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'i1' }));

  fireEvent.click(within(rowOf(container, 'Eggs')).getByLabelText('Actions'));
  fireEvent.click(within(document.querySelector('#actions-menu')).getByText('Delete'));
  fireEvent.click(getByText('OK'));

  expect(itemActions.removeItem).toHaveBeenCalledWith('i2');
});

test('pages hold 100 rows with 25/50/100 options', () => {
  const { container } = renderBrowse(false);

  const pageSize = container.querySelector('.MuiTablePagination-root [role=combobox]');
  expect(pageSize).toHaveTextContent('100');
  fireEvent.mouseDown(pageSize);
  const options = within(document.querySelector('[role=listbox]')).getAllByRole('option').map((o) => o.textContent);
  expect(options).toEqual(['25', '50', '100']);
});
