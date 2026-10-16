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

    let elvesWidget = null
    if(props.useMoreElves) {
        elvesWidget = (
            <span>
                Something is taking longer than expected...
                Waking up more elves...
            </span>
        )
    }

    return (
        <Backdrop className={classes.backdrop} open={true}>
            <SpinnerRoundOutlined color='inherit' />
            {elvesWidget}
        </Backdrop>
    );
}

export default LoadingPanel;