import React from 'react';
import { DatePicker, KeyboardDatePicker } from "@material-ui/pickers";
import PropTypes from 'prop-types'

function Datepicker(props) {
    const ISOdateformat = 'yyyy-MM-dd'
    const today = new Date()

    if (props.isMobile) {
        return (
            <DatePicker
                disableToolbar
                variant="dialog"
                label={props.label}
                helperText={props.helperText}
                value={props.selectedDate}
                onChange={date => props.handleDateChange(date)}
                format={ISOdateformat}
                minDate={today}
            />
        )
    } else {
        return (
            <KeyboardDatePicker
                variant="inline"
                label={props.label}
                value={props.selectedDate}
                onChange={date => props.handleDateChange(date)}
                helperText={props.helperText}
                format={ISOdateformat}
                minDate={today}
            />
        )
    }
}

Datepicker.propTypes = {
    isMobile: PropTypes.bool,
    label: PropTypes.string,
    helperText: PropTypes.string,
    handleDateChange: PropTypes.func,
}

Datepicker.defaultProps = {
    isMobile: false
}

export default Datepicker;