import React from 'react';
import TextField from '@material-ui/core/TextField'
import { DatePicker, KeyboardDatePicker } from "@material-ui/pickers";
import PropTypes from 'prop-types'
import { DATE_FORMAT } from '../constants/constants'

function Datepicker(props) {
    const today = new Date()

    if (props.isMobile) {
        return (
            <DatePicker
                shrink
                autoOk={true}
                disableToolbar
                variant="dialog"
                label={props.label}
                helperText={props.helperText}
                value={props.selectedDate ?? null}
                onChange={date => props.setDate(date)}
                error={props.error}
                TextFieldComponent={(props) => <TextField error={props.error} {...props} />}
                format={DATE_FORMAT}
                minDate={today}
            />
        )
    } else {
        return (
            <KeyboardDatePicker
                autook={true}
                variant="inline"
                label={props.label}
                value={props.selectedDate ?? null}
                onChange={date => props.setDate(date)}
                helperText={props.helperText}
                format={DATE_FORMAT}
                minDate={today}
                error={props.error}
                TextFieldComponent={(props) => <TextField error={props.error} {...props} />}
            />
        )
    }
}

Datepicker.propTypes = {
    isMobile: PropTypes.bool,
    label: PropTypes.string,
    helperText: PropTypes.string,
    setDate: PropTypes.func,
    selectedDate: PropTypes.string,
    error: PropTypes.bool
}

Datepicker.defaultProps = {
    isMobile: false
}

export default Datepicker;