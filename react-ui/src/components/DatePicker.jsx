import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import { parse, isValid } from 'date-fns';
import PropTypes from 'prop-types'
import { DATE_FORMAT } from '../constants/constants'

// The store keeps the date as a DATE_FORMAT string; the picker works with Date objects.
const toDate = (text) => {
    if (!text) {
        return null
    }
    const date = parse(text, DATE_FORMAT, new Date())
    return isValid(date) ? date : null
}

function Datepicker({ isMobile = false, ...rest }) {
    const props = { ...rest, isMobile }
    const today = new Date()
    const Picker = props.isMobile ? MobileDatePicker : DesktopDatePicker

    return (
        <Picker
            label={props.label}
            value={toDate(props.selectedDate)}
            // whatever the picker emits (Date, null or an invalid Date while typing) goes to the store logic unchanged
            onChange={date => props.setDate(date)}
            format={DATE_FORMAT}
            minDate={today}
            closeOnSelect
            slotProps={{
                textField: {
                    error: props.error,
                    helperText: props.helperText
                },
                ...(props.isMobile ? { toolbar: { hidden: true }, actionBar: { actions: ['cancel', 'accept'] } } : {})
            }}
        />
    )
}

Datepicker.propTypes = {
    isMobile: PropTypes.bool,
    label: PropTypes.string,
    helperText: PropTypes.string,
    setDate: PropTypes.func,
    selectedDate: PropTypes.string,
    error: PropTypes.bool
}

export default Datepicker;
