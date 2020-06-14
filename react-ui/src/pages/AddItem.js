import React, { useState, useRef } from 'react';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField'
import { makeStyles } from '@material-ui/core/styles';
import Autocomplete from '../components/Autocomplete'
import Datepicker from '../components/DatePicker'
import { connect } from 'react-redux'
import { itemEditActions } from '../logic/item-edit-add'
import dbProvider from '../persistence'
import Title from '../components/Title';
import clsx from 'clsx';
import syncMonkey from '../common/syncMonkey'
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useTheme } from '@material-ui/core/styles';

const useStyles = makeStyles((theme) => ({
    paper: {
        padding: theme.spacing(2),
        overflow: 'auto',
    },
    spacer1: {
        marginTop: theme.spacing(1)
    },
    spacer2: {
        marginTop: theme.spacing(2)
    },
    spacingLeft: {
        marginLeft: theme.spacing(2),
    },
    spacingRight: {
        marginRight: theme.spacing(1),
    },
    expand: {
        display: 'grid'
    }
}))

const mapStateToProps = (state /*, ownProps*/) => ({
    name: state.itemEditReducer.name,
    date: state.itemEditReducer.date,
    quantity: state.itemEditReducer.quantity,
    unit: state.unit,
    allNames: (userId) => state.itemNameReducer
        .filter(n => !!n.id && !!n.userId && !!n.name && n.name.length > 0)
        .map(n => ({ name: n.name, userId: n.userId }))
        .sort((a, b) => {
            if(a.userId === userId && b.userId !== userId){
                return 1
            } else if(a.userId !== userId && b.userId === userId){
                return -1
            } else {
                return a.name.localeCompare(b.name)}
            }
        )
})

const mapDispatchToProps = (dispatch, ownProps) => ({
    setName: (value) => dispatch(itemEditActions.itemNameChanged(value)),
    setDate: (value) => dispatch(itemEditActions.itemExpirationDateChanged(value)),
    setQuantity: (value) => dispatch(itemEditActions.itemQuantityChanged(value)),
    setUnit: (value) => dispatch(itemEditActions.itemUnitChanged(value)),
    handleCancelClick: () => dispatch(itemEditActions.itemAbandoned),
    handleAddItemClick: () => dispatch(itemEditActions.itemToSave())
})

function AddItem(props) {
    const theme = useTheme()
    const mobile = useMediaQuery(theme.breakpoints.down('sm'));
    const classes = useStyles();
    const spacingTopLeft = clsx(classes.spacer2, classes.spacingLeft)

    syncMonkey.reset()

    const groupingFunction = (el) => {
        return (el.userId === dbProvider.userId) ? 'Your items' : 'Suggestions'
    }

    return (
        <Paper className={classes.paper}>
            <Title>Add new item</Title>
            <Grid>
                <Grid item xs={12} sm={8} md={4} lg={3} xl={1}>
                    <Autocomplete options={props.allNames(dbProvider.userId)}
                        label='Name'
                        value={props.name}
                        setValue={props.setName}
                        groupBy={groupingFunction}
                    />
                </Grid>
                <Grid item xs={12} sm={8} md={4} lg={3} xl={1}>
                    <span className={classes.expand}>
                        <Datepicker label='Expiration date'
                            setDate={(value) => {
                                props.setDate(value)
                            }}
                            isMobile={mobile}
                            selectedDate={props.date}
                        /></span>
                </Grid>
                <Grid item xs={12} sm={8} md={4} lg={3} xl={1}>
                    <Grid container direction='row'>
                        <Grid item xs={6}>
                            <TextField
                                id="tfQuantity"
                                label="Quantity"
                                type="number"
                                value={props.quantity}
                                margin='normal'
                                className={classes.spacingRight}
                                onChange={(event) => props.setQuantity(event.target.value)}
                            />
                        </Grid>
                        <Grid item xs={6}>
                            <Autocomplete options={[{ name: 'l' }, { name: 'kg' }]}
                                label="Unit"
                                value={props.unit}
                                className={classes.spacingLeft}
                                setValue={props.setUnit} />
                        </Grid>
                    </Grid>
                </Grid>
                <Grid item xs={12} sm={6} md={4} lg={3} xl={1}>
                    <Grid container justify="flex-end" direction='row'>
                        <Button variant='contained'
                            className={classes.spacer2}
                            onClick={props.handleCancelClick}>Cancel</Button>
                        <Button variant='contained'
                            className={spacingTopLeft}
                            onClick={props.handleAddItemClick} color="primary">Add new item</Button>
                    </Grid>
                </Grid>
            </Grid>
        </Paper>
    )
}

export default connect(mapStateToProps, mapDispatchToProps)(AddItem)