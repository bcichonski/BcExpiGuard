import { vi } from 'vitest';
import { render, cleanup, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import Autocomplete from '../components/Autocomplete';
import theme from '../theme';

const options = [{ name: 'Apple' }, { name: 'Banana' }, { name: 'Pineapple' }];

const renderAutocomplete = (props) => render(
  <ThemeProvider theme={theme}>
    <Autocomplete label="Name" options={options} value="" setValue={vi.fn()} {...props} />
  </ThemeProvider>
);

afterEach(cleanup);

test('typed free-solo text is propagated through setValue', () => {
  const setValue = vi.fn();
  const { getByLabelText } = renderAutocomplete({ setValue });

  fireEvent.change(getByLabelText('Name'), { target: { value: 'Che' } });

  expect(setValue).toHaveBeenCalledWith('Che');
});

test('the input shows the controlled value', () => {
  const { getByLabelText } = renderAutocomplete({ value: 'Banana' });

  expect(getByLabelText('Name')).toHaveValue('Banana');
});

test('a reset event does not wipe a non-empty value', () => {
  const setValue = vi.fn();
  const { getByLabelText } = renderAutocomplete({ value: 'Apple', setValue });
  const input = getByLabelText('Name');

  // Blurring a free-solo input with no selected option makes MUI emit a 'reset' input change with ''.
  fireEvent.focus(input);
  fireEvent.blur(input);

  expect(setValue).not.toHaveBeenCalledWith('');
});

test('options render with the matched part highlighted', () => {
  const { getByLabelText, getAllByRole } = renderAutocomplete({ value: 'pine' });
  const input = getByLabelText('Name');

  fireEvent.focus(input);
  fireEvent.keyDown(input, { key: 'ArrowDown' });

  const rendered = getAllByRole('option');
  expect(rendered).toHaveLength(1);
  const spans = Array.from(rendered[0].querySelectorAll('span'));
  expect(spans.map((s) => s.textContent)).toEqual(['Pine', 'apple']);
  expect(spans[0].style.fontWeight).toBe('700');
  expect(spans[1].style.fontWeight).toBe('400');
});

test('options are grouped with groupBy', () => {
  const { getByLabelText, getByText } = renderAutocomplete({
    groupBy: (o) => o.name[0].toUpperCase(),
  });
  const input = getByLabelText('Name');

  fireEvent.focus(input);
  fireEvent.keyDown(input, { key: 'ArrowDown' });

  expect(getByText('A')).toBeInTheDocument();
  expect(getByText('B')).toBeInTheDocument();
});

test('autoFocus defaults to false: the input is focused only when autoFocus is passed', () => {
  const unfocused = renderAutocomplete();
  expect(unfocused.getByLabelText('Name')).not.toHaveFocus();
  cleanup();
  const focused = renderAutocomplete({ autoFocus: true });
  expect(focused.getByLabelText('Name')).toHaveFocus();
});
