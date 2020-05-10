import React from 'react';
import TextField from '@material-ui/core/TextField';
import { Autocomplete as LabAutocomplete } from '@material-ui/lab';
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';
import PropTypes from 'prop-types'

function Autocomplete(props) {
  return (
    <LabAutocomplete
      freeSolo
      inputValue={props.value}
      onInputChange={(event, newValue) => {
        props.setValue(newValue);
      }}
      options={props.options}
      getOptionLabel={(option) => option?.name ?? ''}
      renderInput={(params) => (
        <TextField {...params} label={props.label} margin="normal" />
      )}
      renderOption={(option, { inputValue }) => {
        const matches = match(option.name, inputValue);
        const parts = parse(option.name, matches);

        return (
          <div>
            {parts.map((part, index) => (
              <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                {part.text}
              </span>
            ))}
          </div>
        );
      }}
    />
  );
}

Autocomplete.propTypes = {
  options : PropTypes.array,
  label : PropTypes.string,
  value : PropTypes.string,
  setValue : PropTypes.func.isRequired
}

export default Autocomplete;