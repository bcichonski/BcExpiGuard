import React, { useState } from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import PropTypes from 'prop-types';

function InputDialog(props) {
    const [inputValue, setInputValue] = useState(props.value);
    const [error, setError] = useState(false)
    const [errorText, setErrorText] = useState(false)

    const handleInputValue = (value) => {
        setInputValue(value)
        if (isNaN(value)) {
            setError(true)
            setErrorText('It must be a number')
            return
        }
        let val = parseFloat(value)
        if (val < 0) {
            setError(true)
            setErrorText('Nice try. If you are so clever you know why it makes no actual sense')
            return
        }
        if (val > props.maxValue) {
            setError(true)
            setErrorText("That is too many")
            return
        }

        setErrorText('')
        setError(false)
    }

    const handleCancel = () => {
        props.onClose(false)
    };

    const handleOk = () => {
        if (error) {
            return
        }
        props.onClose(inputValue)
    };

    return (
        <Dialog open={props.open} onClose={handleCancel} aria-labelledby="form-dialog-title">
            <DialogTitle id="form-dialog-title">{props.title}</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    {props.descript}
                </DialogContentText>
                <TextField
                    autoFocus
                    margin="dense"
                    id="input"
                    label={props.inputLabel}
                    value={inputValue}
                    onChange={(event) => handleInputValue(event.target.value)}
                    error={error}
                    helperText={errorText}
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleOk} color="primary" disabled={error}>
                    OK
                </Button>
            </DialogActions>
        </Dialog>
    )
}

InputDialog.propTypes = {
    title: PropTypes.string,
    descript: PropTypes.string,
    inputLabel: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    value: PropTypes.string,
    maxValue: PropTypes.number
};

export default InputDialog