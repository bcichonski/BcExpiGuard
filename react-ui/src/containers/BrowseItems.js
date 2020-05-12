import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Paper from '@material-ui/core/Paper';
import Title from '../components/Title'

const useStyles = makeStyles((theme) => ({
    paper: {
        padding: theme.spacing(2),
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column',
    }
}))

function BrowseItems(props) {
    const classes = useStyles()

    return (
        <div>
            <Paper className={classes.paper}>
                <Title>Browse all</Title>
            </Paper>
        </div>
    )
}


export default BrowseItems;