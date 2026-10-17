import TextField from '@mui/material/TextField';
import MuiAutocomplete from '@mui/material/Autocomplete';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import PropTypes from 'prop-types'

function Autocomplete({ autoFocus = false, ...rest }) {
  const props = { ...rest, autoFocus }
  return (
    <MuiAutocomplete
      freeSolo
      inputValue={props.value}
      onInputChange={(event, newValue, kind) => {
        if (kind === 'reset' && props.value !== '' && newValue === '') {
          props.setValue(props.value);
        } else {
          props.setValue(newValue);
        }
      }}
      options={props.options}
      getOptionLabel={(option) => option?.name ?? ''}
      groupBy={props.groupBy}
      renderInput={(params) => (
        <TextField {...params} label={props.label} margin="normal" helperText={props.helperText} error={props.error} autoFocus={props.autoFocus} />
      )}
      renderOption={(optionProps, option, { inputValue }) => {
        const { key, ...liProps } = optionProps;
        const matches = match(option.name, inputValue);
        const parts = parse(option.name, matches);

        return (
          <li key={key} {...liProps}>
            <div>
              {parts.map((part, index) => (
                <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                  {part.text}
                </span>
              ))}
            </div>
          </li>
        );
      }}
    />
  );
}

Autocomplete.propTypes = {
  options: PropTypes.array,
  label: PropTypes.string,
  value: PropTypes.string,
  setValue: PropTypes.func.isRequired,
  groupBy: PropTypes.func,
  error: PropTypes.bool,
  autoFocus: PropTypes.bool
}

export default Autocomplete;