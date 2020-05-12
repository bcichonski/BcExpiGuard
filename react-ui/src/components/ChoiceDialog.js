import React from 'react';
import PropTypes from 'prop-types';
//import { makeStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
//import useMediaQuery from '@material-ui/core/useMediaQuery';
//import { useTheme } from '@material-ui/core/styles';

/*const useStyles = makeStyles({
});*/

function ChoiceDialog(props) {
    //const classes = useStyles();
    const { title, choices, onClose, open } = props;

    const handleClose = () => {
        onClose(choices[0]);
    };

    const handleListItemClick = (value) => {
        onClose(value);
    };

    //const theme = useTheme();
    //const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    return (
        <Dialog onClose={handleClose} open={open}>
            <DialogTitle id="simple-dialog">{title}</DialogTitle>
            <List>
                {choices.map((choice) => (
                    <ListItem button onClick={() => handleListItemClick(choice.id)} key={choice.id}>
                        <ListItemText primary={choice.name} />
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