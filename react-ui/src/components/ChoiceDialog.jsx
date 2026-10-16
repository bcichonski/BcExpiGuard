import React from 'react';
import PropTypes from 'prop-types';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import DialogTitle from '@mui/material/DialogTitle';
import Dialog from '@mui/material/Dialog';

function ChoiceDialog(props) {
    const { title, choices, onClose, open } = props;

    const handleClose = () => {
        onClose(choices[0]);
    };

    const handleListItemClick = (value) => {
        onClose(value);
    };

    return (
        <Dialog onClose={handleClose} open={open}>
            <DialogTitle id="simple-dialog">{title}</DialogTitle>
            <List>
                {choices.map((choice) => (
                    <ListItem disablePadding key={choice.id}>
                        <ListItemButton onClick={() => handleListItemClick(choice.id)}>
                            <ListItemText primary={choice.name} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Dialog>
    );
}

ChoiceDialog.propTypes = {
    title: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    choices: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string
    }))
};

export default ChoiceDialog;