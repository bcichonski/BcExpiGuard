import React from 'react';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Autocomplete from '../components/Autocomplete'
import Datepicker from '../components/DatePicker'
import { connect } from 'react-redux'
import { itemEditActions } from '../logic/item-edit-add'

const useStyles = makeStyles((theme) => ({
    paper: {
        padding: theme.spacing(2),
        overflow: 'auto',
    },
    buttons: {
        margin: theme.spacing(2),
    }
}))

const mapStateToProps = (state /*, ownProps*/) => {
    return {
        name: state.name,
        date: state.date
    }
}

const mapDispatchToProps = {
    itemNameChanged: itemEditActions.itemNameChanged,
    itemExpirationChanged: itemEditActions.itemExpirationChanged
}

function AddItem(props) {
    const classes = useStyles();

    return (
        <Paper className={classes.paper}>
            <Grid direction="column"
                justify="flex-start"
                alignItems="flex-start">
                <Grid item xs={12} sm={8} md={6} lg={4} xl={2}>
                    <Autocomplete options={[{ name: 'test' }]} label='Name' value={props.name} setValue={props.itemNameChanged} />
                </Grid>
                <Grid item xs={12} sm={8} md={6} lg={4} xl={2}>
                    <Datepicker label='Expiration date' helperText='Select when this thing will be to old for usage' />
                </Grid>
                <Grid item xs={12} sm={8} md={6} lg={4} xl={2}>
                    <Grid container justify="flex-end" direction='row'>
                        <Button variant='contained' className={classes.buttons}>Cancel</Button>
                        <Button variant='contained' className={classes.buttons} color="primary">Add new item</Button>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    )
}

export default connect(mapStateToProps, mapDispatchToProps)(AddItem)