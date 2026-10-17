import PropTypes from 'prop-types'
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import Tooltip from '@mui/material/Tooltip'
import SyncIcon from '@mui/icons-material/Sync';
import SyncProblemIcon from '@mui/icons-material/SyncProblem';
import SyncDisabledIcon from '@mui/icons-material/SyncDisabled';
import Badge from '@mui/material/Badge';

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
