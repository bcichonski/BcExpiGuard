import React, { useState } from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
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