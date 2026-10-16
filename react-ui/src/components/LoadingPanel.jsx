import React from 'react'
import { SpinnerRoundOutlined  } from 'spinners-react';
import Backdrop from '@mui/material/Backdrop';

function LoadingPanel(props) {
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
        <Backdrop sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, color: '#fff' }} open={true}>
            <SpinnerRoundOutlined color='inherit' />
            {elvesWidget}
        </Backdrop>
    );
}

export default LoadingPanel;