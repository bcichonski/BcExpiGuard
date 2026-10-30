import { vi } from 'vitest';
import { render, cleanup, fireEvent, within, waitFor, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, format } from 'date-fns';
import DatePicker from '../components/DatePicker';
import theme from '../theme';
import { DATE_FORMAT } from '../constants/constants';

const renderPicker = (props) => render(
  <ThemeProvider theme={theme}>
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DatePicker label="Expiration date" setDate={vi.fn()} {...props} />
    </LocalizationProvider>
  </ThemeProvider>
);

afterEach(cleanup);

const future = addDays(new Date(), 10);
const futureText = format(future, DATE_FORMAT);

// v9 renders the field as a labelled group of spinbutton sections (Year, Month, Day)
// plus a hidden input that carries the formatted value.
const getField = () => screen.getByRole('group', { name: 'Expiration date' });
const getHiddenInput = () => getField().querySelector('input');
const getSectionsText = () => ['Year', 'Month', 'Day']
  .map(name => within(getField()).getByRole('spinbutton', { name }).textContent)
  .join('-');

// sections are contenteditable: type into one the way the browser reports it (an input event)
const typeIntoSection = (name, text) => {
  const section = within(getField()).getByRole('spinbutton', { name });
  fireEvent.focus(section);
  section.textContent = text;
  fireEvent.input(section, { inputType: 'insertText', data: text });
};

test('a yyyy-MM-dd string renders as that text (desktop)', () => {
  renderPicker({ selectedDate: futureText });
  expect(getSectionsText()).toBe(futureText);
  expect(getHiddenInput().value).toBe(futureText);
});

test('a yyyy-MM-dd string renders as that text (mobile)', () => {
  renderPicker({ selectedDate: futureText, isMobile: true });
  expect(getSectionsText()).toBe(futureText);
  expect(getHiddenInput().value).toBe(futureText);
});

test('an empty value renders an empty field', () => {
  renderPicker({ selectedDate: '' });
  expect(getHiddenInput().value).toBe('');
  // empty sections show the format placeholders, not digits
  expect(getSectionsText()).toBe('YYYY-MM-DD');
});

test('typing a date calls setDate with a Date that formats back to the same string', () => {
  const setDate = vi.fn();
  renderPicker({ setDate });
  const [year, month, day] = futureText.split('-');
  typeIntoSection('Year', year);
  typeIntoSection('Month', month);
  typeIntoSection('Day', day);
  expect(setDate).toHaveBeenCalled();
  const emitted = setDate.mock.calls[setDate.mock.calls.length - 1][0];
  expect(emitted).toBeInstanceOf(Date);
  expect(format(emitted, DATE_FORMAT)).toBe(futureText);
});

test('picking a day in the mobile dialog calls setDate with that Date and closes the dialog', async () => {
  const setDate = vi.fn();
  const { getByRole, findByRole, queryByRole } = renderPicker({ setDate, isMobile: true, selectedDate: format(addDays(new Date(), 1), DATE_FORMAT) });
  fireEvent.click(getByRole('button', { name: /choose date/i }));
  const dialog = await findByRole('dialog');
  // pick the last enabled day of the displayed month that is not already selected
  // (re-picking the selected day is a no-op, which broke this test whenever tomorrow was the last of the month)
  const days = within(dialog).getAllByRole('gridcell')
    .filter(c => !c.disabled && c.textContent && c.getAttribute('aria-selected') !== 'true');
  fireEvent.click(days[days.length - 1]);
  expect(setDate).toHaveBeenCalled();
  expect(setDate.mock.calls[0][0]).toBeInstanceOf(Date);
  await waitFor(() => expect(queryByRole('dialog')).toBeNull());
});

test('dates before today are disabled in the picker', async () => {
  const { getByRole, findByRole } = renderPicker({ isMobile: true, selectedDate: format(addDays(new Date(), 1), DATE_FORMAT) });
  fireEvent.click(getByRole('button', { name: /choose date/i }));
  const dialog = await findByRole('dialog');
  const yesterday = addDays(new Date(), -1);
  const cells = within(dialog).queryAllByRole('gridcell').filter(c => c.textContent === String(yesterday.getDate()));
  // yesterday is displayed only when it falls in the shown month; if so it must be disabled
  cells.forEach(c => expect(c.disabled).toBe(true));
});

test('the error state and helper text are shown', () => {
  const { getByText } = renderPicker({ error: true, helperText: 'Pick a valid date' });
  expect(getByText('Pick a valid date')).toBeTruthy();
  expect(getField().getAttribute('aria-invalid')).toBe('true');
  expect(getField().getAttribute('aria-describedby')).toBe(getByText('Pick a valid date').id);
});

test('isMobile defaults to false: omitted renders the desktop picker (no Cancel/OK action bar), true the mobile one', async () => {
  const desktop = renderPicker({ selectedDate: futureText });
  fireEvent.click(desktop.getByRole('button', { name: /choose date/i }));
  await desktop.findByRole('dialog');
  expect(desktop.queryByRole('button', { name: /cancel/i })).toBeNull();
  cleanup();
  const mobile = renderPicker({ selectedDate: futureText, isMobile: true });
  fireEvent.click(mobile.getByRole('button', { name: /choose date/i }));
  await mobile.findByRole('dialog');
  expect(mobile.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
});
