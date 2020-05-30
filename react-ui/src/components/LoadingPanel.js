import React from 'react'
import { SpinnerRoundOutlined  } from 'spinners-react';
import Backdrop from '@material-ui/core/Backdrop';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    backdrop: {
        zIndex: theme.zIndex.drawer + 1,
        color: '#fff',
    },
}));

function LoadingPanel(props) {
    const classes = useStyles()
    return (
        <Backdrop className={classes.backdrop} open={true}>
            <SpinnerRoundOutlined color='inherit' />
        </Backdrop>
    );
}

export default LoadingPanel;