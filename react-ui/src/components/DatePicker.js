import React from 'react';
import { DatePicker, KeyboardDatePicker } from "@material-ui/pickers";
import PropTypes from 'prop-types'
import { DATE_FORMAT } from '../constants/constants'

function Datepicker(props) {
    const today = new Date()

    if (props.isMobile) {
        return (
            <DatePicker
                shrink
                autoOk
                disableToolbar
                variant="dialog"
                label={props.label}
                helperText={props.helperText}
                value={props.selectedDate}
                onChange={date => props.setDate(date)}
                format={DATE_FORMAT}
                minDate={today}
            />
        )
    } else {
        return (
            <KeyboardDatePicker
                autook
                variant="inline"
                label={props.label}
                value={props.selectedDate}
                onChange={date => props.setDate(date)}
                helperText={props.helperText}
                format={DATE_FORMAT}
                minDate={today}
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