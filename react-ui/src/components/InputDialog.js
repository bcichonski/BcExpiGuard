import React from 'react';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import PropTypes from 'prop-types';

function InputDialog(props) {
    const [inputValue, setInputValue] = React.useState(props.value);

    const handleCancel = () => {
        props.onClose(false)
    };

    const handleOk = () => {
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
                    onChange={(event) => setInputValue(event.target.value)}
                    fullWidth
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCancel} color="primary">
                    Cancel
                </Button>
                <Button onClick={handleOk} color="primary">
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
};

export default InputDialog