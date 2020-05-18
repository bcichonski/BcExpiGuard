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
// @ts-ignore
import MaterialTable, { MTableToolbar } from 'material-table'
import Title from '../components/Title'
import React, { forwardRef, Fragment } from 'react';
import { connect } from 'react-redux';
import { Grid } from '@material-ui/core';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

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
    ViewColumn: forwardRef((props, ref) => <ViewColumn {...props} ref={ref} />)
};


const useStyles = makeStyles((theme) => ({
    spacing: {
        padding: theme.spacing(2),
        display: 'flex',
        overflow: 'auto',
        flexDirection: 'column',
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
    const mainFilter = 'active'
    return { data, mainFilter }
}

const mapDispatchToProps = (state) => {
    const handleMainFilterChange = (dispatch) => { }

    return {
        handleMainFilterChange
    }
}

function BrowseItems(props) {
    const classes = useStyles()

    return (
        <Grid container direction='column'>
            <Grid item>
                <Paper className={classes.spacing}>
                    <Title>Browse</Title>
                </Paper>
            </Grid>
            <Grid item className={classes.hovered}>
                <MaterialTable
                    options={{ paging: false, filtering: false }}
                    actions={[
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
                    ]}
                    columns={[
                        { title: 'Name', field: 'name' },
                        { title: 'Quantity', field: 'quantity' },
                        { title: 'Expiration date', field: 'date' }
                    ]}
                    data={props.data}
                    title=""
                    icons={tableIcons}
                    components={{
                        Toolbar: props => (
                            <Grid container direction='columns'>
                                <Grid item sm={3} className={classes.spacing}>
                                    <InputLabel id="main-filter-label">Filter</InputLabel>
                                    <Select
                                        labelId="main-filter-label"
                                        id="main-filter"
                                        value={props.mainFilterValue}
                                        onChange={props.handleFilterChange}
                                    >
                                        <MenuItem value='active'>Active</MenuItem>
                                        <MenuItem value='expired'>Expired</MenuItem>
                                        <MenuItem value='none'>None</MenuItem>
                                    </Select>
                                </Grid>
                                <Grid item sm={9} className={classes.spacing}>
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