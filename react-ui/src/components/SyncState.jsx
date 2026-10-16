import React from 'react'
import PropTypes from 'prop-types'
import SyncAltIcon from '@material-ui/icons/SyncAlt';
import Tooltip from '@material-ui/core/Tooltip'
import SyncIcon from '@material-ui/icons/Sync';
import SyncProblemIcon from '@material-ui/icons/SyncProblem';
import SyncDisabledIcon from '@material-ui/icons/SyncDisabled';
import Badge from '@material-ui/core/Badge';

const SyncState = (props) => {
    let icon = (
        <SyncAltIcon />
    )
    if (props.state === 'changed') {
        icon = (
            <SyncIcon />
        )
    } else if (props.state === 'error') {
        icon = (
            <SyncProblemIcon />
        )
    } else if (props.state === 'disabled') {
        icon = (
            <SyncDisabledIcon />
        )
    }

    if (props.count) {
        icon = (
            <Badge badgeContent={props.count}>
                {icon}
            </Badge>
        )
    }

    return (
        <Tooltip key='syncState' title={props.hint}>
            {icon}
        </Tooltip>
    )
}

SyncState.propTypes = {
    state: PropTypes.string,
    hint: PropTypes.string,
    count: PropTypes.number
}

export default SyncState
