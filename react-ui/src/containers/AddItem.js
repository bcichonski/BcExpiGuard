import React from 'react';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import Autocomplete from '../components/Autocomplete'
import Datepicker from '../components/DatePicker'
import { connect } from 'react-redux'
import { itemEditActions } from '../logic/item-edit-add'
import parseISO from 'date-fns/parseISO'
import Title from '../components/Title';

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
        name: state.itemEditReducer.name,
        date: parseISO(state.itemEditReducer.date)
    }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
    setName: (value) => dispatch(itemEditActions.itemNameChanged(value)),
    setDate: (value) => dispatch(itemEditActions.itemExpirationDateChanged(value)),
    handleCancelClick: () => dispatch(itemEditActions.itemAbandoned)
})

function AddItem(props) {
    const classes = useStyles();

    return (
        <Paper className={classes.paper}>
            <Title>Add new item</Title>
            <Grid>
                <Grid item xs={12} sm={8} md={6} lg={4} xl={2}>
                    <Autocomplete options={[{ name: 'test' }]} label='Name' value={props.name} setValue={props.setName} />
                </Grid>
                <Grid item xs={12} sm={8} md={6} lg={4} xl={2}>
                    <Datepicker label='Expiration date' helperText='Select when this thing will be too old for usage'
                        setDate={props.setDate} selectedDate={props.date} />
                </Grid>
                <Grid item xs={12} sm={8} md={6} lg={4} xl={2}>
                    <Grid container justify="flex-end" direction='row'>
                        <Button variant='contained' className={classes.buttons} onClick={props.handleCancelClick}>Cancel</Button>
                        <Button variant='contained' className={classes.buttons} color="primary">Add new item</Button>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    )
}

export default connect(mapStateToProps, mapDispatchToProps)(AddItem)