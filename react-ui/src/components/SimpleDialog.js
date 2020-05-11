import React from 'react';
import PropTypes from 'prop-types';
//import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';

/*const useStyles = makeStyles({
});*/

function SimpleDialog(props) {
    //const classes = useStyles();
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
                    <ListItem button onClick={() => handleListItemClick(choice)} key={choice}>
                        <ListItemText primary={choice} />
                    </ListItem>
                ))}
            </List>
        </Dialog>
    );
}

SimpleDialog.propTypes = {
    title: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
    choices: PropTypes.array
};

export default SimpleDialog;