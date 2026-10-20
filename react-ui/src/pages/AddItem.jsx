import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField'
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem'
import useMediaQuery from '@mui/material/useMediaQuery';
import { styled, useTheme } from '@mui/material/styles';
import Autocomplete from '../components/Autocomplete'
import Datepicker from '../components/DatePicker'
import { connect } from 'react-redux'
import { itemEditActions, itemEditTypes } from '../logic/item-edit-add'
import { itemTypes } from '../logic/item-list'
import dbProvider from '../persistence'
import Title from '../components/Title';

// v4 Grid items under a non-container parent were sized as a share of the parent's width; v7 Grid sizes need a
// container, so the same widths (12-column share per breakpoint) are applied here directly.
const share = (columns) => `${(columns / 12) * 100}%`
const Column = styled('div', { shouldForwardProp: (prop) => prop !== 'sm' })(({ theme, sm }) => ({
    [theme.breakpoints.up('xs')]: { width: share(12) },
    [theme.breakpoints.up('sm')]: { width: share(sm) },
    [theme.breakpoints.up('md')]: { width: share(4) },
    [theme.breakpoints.up('lg')]: { width: share(3) },
    [theme.breakpoints.up('xl')]: { width: share(1) },
}));

const FormPaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    overflow: 'auto',
}));

const mapStateToProps = (state /*, ownProps*/) => {
    return ({
        id: state.itemEditReducer.id,
        name: state.itemEditReducer.name,
        date: state.itemEditReducer.date,
        quantity: state.itemEditReducer.quantity,
        unit: state.itemEditReducer.unit,
        state: state.itemEditReducer.itemState,
        edit: state.itemEditReducer.state === itemEditTypes.ITEM_DIALOG_EDIT,
        dateError: state.itemEditReducer.dateError,
        nameError: state.itemEditReducer.nameError,
        allNames: (userId) => state.itemNameReducer
            .filter(n => !!n.id && !!n.userId && !!n.name && n.name.length > 0)
            .map(n => ({ name: n.name, userId: n.userId }))
            .sort((a, b) => {
                if (a.userId === userId && b.userId !== userId) {
                    return -1
                } else if (a.userId !== userId && b.userId === userId) {
                    return 1
                } else {
                    return a.name.localeCompare(b.name)
                }
            })
    })
}

const mapDispatchToProps = (dispatch, ownProps) => ({
    setName: (value) => dispatch(itemEditActions.itemNameChanged(value)),
    setDate: (value) => dispatch(itemEditActions.itemExpirationDateChanged(value)),
    setQuantity: (value) => dispatch(itemEditActions.itemQuantityChanged(value)),
    setUnit: (value) => dispatch(itemEditActions.itemUnitChanged(value)),
    setState: (value) => dispatch(itemEditActions.itemStateChanged(value)),
    handleCancelClick: () => dispatch(itemEditActions.itemAbandoned),
    handleAddItemClick: () => dispatch(itemEditActions.itemToSave())
})

const units = [
    { name: 'metre', group: 'length' },
    { name: 'centimetre', group: 'length' },
    { name: 'gram', group: 'weight' },
    { name: 'kilogram', group: 'weight' },
    { name: 'litre', group: 'capacity' },
    { name: 'millilitre', group: 'capacity' },
    { name: 'item', group: 'unit' },
    { name: 'pack', group: 'unit' },
    { name: 'unit', group: 'unit' },
].sort((a, b) => {
    const unitCmp = a.group.localeCompare(b.group);
    if (unitCmp === 0) {
        return a.name.localeCompare(b.name)
    } else {
        return unitCmp
    }
})

function AddItem(props) {
    const theme = useTheme()
    // v4 down('sm') meant < 960px; with the theme's v4 breakpoint values that is down('md') in MUI v7
    const mobile = useMediaQuery(theme.breakpoints.down('md'));

    const namesGroupingFunction = (el) => {
        return (el.userId === dbProvider.userId) ? 'Your items' : 'Suggestions'
    }

    let editOptions = null;
    if (props.edit) {
        editOptions = (
            <Column sm={6}>
                <Grid container direction='row'>
                    <Grid sx={{ mt: 2 }}>
                        <InputLabel htmlFor="item-state">Age</InputLabel>
                        <Select
                            autoWidth
                            inputProps={{
                                name: 'State',
                                id: 'item-state'
                            }}
                            value={props.state}
                            onChange={(event) => props.setState(event.target.value)}>
                            <MenuItem value={itemTypes.ITEM_ACTIVE}>Active</MenuItem>
                            <MenuItem value={itemTypes.ITEM_DONE}>Done</MenuItem>
                            <MenuItem value={itemTypes.ITEM_REMOVED}>Deleted</MenuItem>
                        </Select></Grid>
                </Grid>
            </Column>
        )
    }

    const unitsGroupingFunction = (el) => el.group
    const anError = !!(props.dateError || props.nameError)
    return (
        <FormPaper>
            <Title>{props.edit ? `Edit '${props.name}'` : 'Add new item'}</Title>
            <Grid>
                <Column sm={8}>
                    <Autocomplete options={props.allNames(dbProvider.userId)}
                        label='Name'
                        value={props.name}
                        setValue={props.setName}
                        groupBy={namesGroupingFunction}
                        error={props.nameError}
                        helperText={props.nameError ? 'You cannot add an item without a name' : ''}
                        autoFocus
                    />
                </Column>
                <Column sm={8}>
                    <span style={{ display: 'grid' }}>
                        <Datepicker label='Expiration date'
                            setDate={(value) => {
                                props.setDate(value)
                            }}
                            isMobile={mobile}
                            selectedDate={props.date}
                            error={props.dateError}
                            helperText={props.dateError ? 'Pick a valid date' : ''}
                        /></span>
                </Column>
                <Column sm={8}>
                    <Grid container direction='row'>
                        <Grid size={6}>
                            <TextField
                                id="tfQuantity"
                                label="Quantity"
                                type="number"
                                value={props.quantity}
                                margin='normal'
                                sx={{ mr: 1 }}
                                onChange={(event) => props.setQuantity(event.target.value)}
                            />
                        </Grid>
                        <Grid size={6}>
                            <Autocomplete options={units}
                                label="Unit"
                                value={props.unit}
                                groupBy={unitsGroupingFunction}
                                setValue={props.setUnit} />
                        </Grid>
                    </Grid>
                </Column>
                {editOptions}
                <Column sm={6}>
                    <Grid container justifyContent="flex-end" direction='row'>
                        <Button variant='contained'
                            color='inherit'
                            sx={{ mt: 2 }}
                            onClick={props.handleCancelClick}>Cancel</Button>
                        <Button variant='contained'
                            sx={{ mt: 2, ml: 2 }}
                            disabled={anError}
                            onClick={props.handleAddItemClick} color={(anError ? "inherit" : "primary")}>{props.edit ? 'Save' : 'Add new item'}</Button>
                    </Grid>
                </Column>
            </Grid>
        </FormPaper>
    )
}

export default connect(mapStateToProps, mapDispatchToProps)(AddItem)