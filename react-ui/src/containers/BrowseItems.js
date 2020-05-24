import { makeStyles } from '@material-ui/core/styles';
import AddBox from '@material-ui/icons/AddBox';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import Check from '@material-ui/icons/Check';
import Clear from '@material-ui/icons/Clear';
import DeleteOutline from '@material-ui/icons/DeleteOutline';
import FilterList from '@material-ui/icons/FilterList';
import Paper from '@material-ui/core/Paper'
import Remove from '@material-ui/icons/Remove';
import SaveAlt from '@material-ui/icons/SaveAlt';
import Search from '@material-ui/icons/Search';
import ViewColumn from '@material-ui/icons/ViewColumn';
import EditOutlinedIcon from '@material-ui/icons/EditOutlined';
import MoreVertOutlinedIcon from '@material-ui/icons/MoreVertOutlined';
// @ts-ignore
import MaterialTable, { MTableToolbar } from 'material-table'
import Title from '../components/Title'
import React, { forwardRef, useState } from 'react';
import { connect } from 'react-redux';
import { Grid, FormHelperText } from '@material-ui/core';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { itemTypes } from '../logic/item-list'
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';
import AssignmentTurnedInOutlinedIcon from '@material-ui/icons/AssignmentTurnedInOutlined';

const tableIcons = {
    Add: forwardRef((props, ref) => <AddBox {...props} ref={ref} />),
    Check: forwardRef((props, ref) => <Check {...props} ref={ref} />),
    Clear: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Delete: forwardRef((props, ref) => <DeleteOutline {...props} ref={ref} />),
    Save: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
    Edit: forwardRef((props, ref) => <EditOutlinedIcon {...props} ref={ref} />),
    Export: forwardRef((props, ref) => <SaveAlt {...props} ref={ref} />),
    Filter: forwardRef((props, ref) => <FilterList {...props} ref={ref} />),
    //FirstPage: forwardRef((props, ref) => <FirstPage {...props} ref={ref} />),
    //LastPage: forwardRef((props, ref) => <LastPage {...props} ref={ref} />),
    //NextPage: forwardRef((props, ref) => <ChevronRight {...props} ref={ref} />),
    //PreviousPage: forwardRef((props, ref) => <ChevronLeft {...props} ref={ref} />),
    ResetSearch: forwardRef((props, ref) => <Clear {...props} ref={ref} />),
    Search: forwardRef((props, ref) => <Search {...props} ref={ref} />),
    SortArrow: forwardRef((props, ref) => <ArrowDownward {...props} ref={ref} />),
    ThirdStateCheck: forwardRef((props, ref) => <Remove {...props} ref={ref} />),
    ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />),
    MoreVertOutlined: forwardRef((props, ref) => <MoreVertOutlinedIcon {...props} ref={ref} />),
    AssignmentTurnedInOutlined: forwardRef((props, ref) => <AssignmentTurnedInOutlinedIcon {...props} ref={ref} />),
};


const useStyles = makeStyles((theme) => ({
    spacingLeftRight: {
        '& div.MuiGrid-root': {
            paddingLeft: theme.spacing(2),
            paddingRight: theme.spacing(2)
        }
    },
    spacing: {
        padding: theme.spacing(2),
        flexGrow: 1,
        overflow: 'auto',
    },
    hovered: {
        '& tbody>.MuiTableRow-root:hover': {
            background: theme.palette.action.hover
        }
    }
}))

function normalize(collection, state) {
    return collection.map(item => ({
        ...item,
        name: state.itemNameReducer.find(nm => nm.id === item.nameID).name ?? item.nameID,
    }))
}

const mapStateToProps = (state) => {
    const data = normalize(state.itemReducer, state)
    return { data }
}

const mapDispatchToProps = (state) => {
    return {
    }
}

function BrowseItems(props) {
    const classes = useStyles()
    const theme = useTheme()
    const [mainFilterValue, setMainFilterValue] = useState(itemTypes.ITEM_ACTIVE)

    const filteredData = props.data.filter((item) => mainFilterValue === 'none' || item.state === mainFilterValue)

    const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

    let actions = []
    let actionloc = {
        header: {
            actions: ''
        }
    }
    if (!fullScreen) {
        actions = [
            {
                icon: tableIcons.Delete,
                tooltip: 'Delete',
                onClick: (event, rowData) => {
                    // Do save operation
                }
            },
            {
                icon: tableIcons.Edit,
                tooltip: 'Edit',
                onClick: (event, rowData) => {
                    // Do save operation
                }
            },
            {
                icon: tableIcons.AssignmentTurnedInOutlined,
                tooltip: 'Dealt with',
                onClick: (event, rowData) => {
                    // Do save operation
                }
            },
        ]
        actionloc = { }
    } else {
        actions = [
            {
                icon: tableIcons.MoreVertOutlined,
                tooltip: 'Actions',
                onClick: (event, rowData) => {
                    // Do save operation
                }
            }
        ]
    }

    return (
        <Grid container direction='column'>
            <Grid item>
                <Paper className={classes.spacing}>
                    <Title>Browse</Title>
                </Paper>
            </Grid>
            <Grid item className={clsx(classes.hovered, classes.spacingLeftRight)}>
                <MaterialTable
                    options={{ paging: false, filtering: false }}
                    actions={actions}
                    columns={[
                        { title: 'Name', field: 'name' },
                        { title: 'Quantity', field: 'quantity' },
                        { title: 'Unit', field: 'unit' },
                        { title: 'Expiration date', field: 'date' }
                    ]}
                    localization={actionloc}
                    data={filteredData}
                    title=""
                    icons={tableIcons}
                    components={{
                        Toolbar: props => (
                            <Grid container direction='columns' justify='space-between' alignItems='flex-end'>
                                <Grid item sm={3} xs={3} className={classes.spacing}>
                                    <InputLabel id="main-filter-label">Filter</InputLabel>
                                    <Select
                                        labelId="main-filter-label"
                                        id="main-filter"
                                        value={mainFilterValue}
                                        onChange={(event) => setMainFilterValue(event.target.value)}
                                    >
                                        <MenuItem value={itemTypes.ITEM_ACTIVE}>Active</MenuItem>
                                        <MenuItem value={itemTypes.ITEM_DONE}>Expired</MenuItem>
                                        <MenuItem value='none'>None</MenuItem>
                                    </Select>
                                </Grid>
                                <Grid item sm={8} xs={8} className={classes.spacing}>
                                    <MTableToolbar {...props} />
                                </Grid>
                            </Grid>
                        )
                    }}
                />
            </Grid>
        </Grid>

    )
}


export default connect(mapStateToProps, mapDispatchToProps)(BrowseItems);