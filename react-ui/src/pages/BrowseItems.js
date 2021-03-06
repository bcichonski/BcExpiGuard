import { makeStyles } from '@material-ui/core/styles';
import AddBox from '@material-ui/icons/AddBox';
import ArrowDownward from '@material-ui/icons/ArrowDownward';
import Check from '@material-ui/icons/Check';
import ConfirmDialog from '../components/ConfirmDialog'
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
import { Grid } from '@material-ui/core';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import { itemTypes } from '../logic/item-list'
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useTheme } from '@material-ui/core/styles';
import clsx from 'clsx';
import AssignmentTurnedInOutlinedIcon from '@material-ui/icons/AssignmentTurnedInOutlined';
import Menu from '@material-ui/core/Menu';
import DealtWithDialog from '../components/DealtWithDialog'
import { itemActions } from '../logic/item-list'
import syncMonkey from '../common/syncMonkey'
import { itemEditActions } from '../logic/item-edit-add';

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
    },
}))

function normalize(collection, state) {
    return collection.map(item => ({
        ...item,
        name: state.itemNameReducer.find(nm => nm.id === item.nameID)?.name ?? item.nameID,
    }))
}

const mapStateToProps = (state) => {
    const data = normalize(state.itemReducer, state)
    return { data }
}

const mapDispatchToProps = (dispatch) => ({
    handleDialogDone: (item, value) => dispatch(itemActions.updateItemQuantity(item, value)),
    handleItemRemoval: (id) => dispatch(itemActions.removeItem(id)),
    handleItemEdit: (item) => dispatch(itemEditActions.itemInEdit(item))
})

function BrowseItems(props) {
    const theme = useTheme()
    const mobile = useMediaQuery(theme.breakpoints.down('sm'));
    const classes = useStyles({ isMobile: mobile })
    const [mainFilterValue, setMainFilterValue] = useState(itemTypes.ITEM_ACTIVE)
    const [menuRowData, setMenuRowData] = React.useState(null);
    const filteredData = props.data.filter((item) => mainFilterValue === 'none' || item.state === mainFilterValue)

    syncMonkey.reset()

    let actions = []
    let actionloc = {
        header: {
            actions: ''
        }
    }
    if (!mobile) {
        actions = [
            {
                icon: tableIcons.Delete,
                tooltip: 'Delete',
                onClick: (event, rowData) => {
                    setMenuRowData(rowData)
                    handleSelected('delete', rowData)
                }
            },
            {
                icon: tableIcons.Edit,
                tooltip: 'Edit',
                onClick: (event, rowData) => {
                    setMenuRowData(rowData)
                    handleSelected('edit', rowData)
                }
            },
            {
                icon: tableIcons.AssignmentTurnedInOutlined,
                tooltip: 'Dealt with',
                onClick: (event, rowData) => {
                    setMenuRowData(rowData)
                    handleSelected('done', rowData)
                }
            },
        ]
        actionloc = {}
    } else {
        actions = [
            {
                icon: tableIcons.MoreVertOutlined,
                tooltip: 'Actions',
                onClick: (event, rowData) => {
                    setMenuRowData(rowData)
                    handleClick(event)
                }
            }
        ]
    }

    const [anchorEl, setAnchorEl] = React.useState(null);
    const [dialogOpen, setDialogOpen] = React.useState(false);
    const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleSelected = (action, rowData) => {
        if(!rowData) {
            rowData = menuRowData
        }
        if (action === 'delete') {
            setConfirmDialogOpen(true)
        } else if (action === 'done') {
            setDialogOpen(true)
        } else if (action === 'edit') {
            props.handleItemEdit(rowData)
        }
        setAnchorEl(null);
    }

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleDialog = (id, value) => {
        setDialogOpen(false)
        props.handleDialogDone(id, value)
    }

    const handleConfirmDialogClose = (value) => {
        if (value) {
            props.handleItemRemoval(menuRowData.id)
        }
        setConfirmDialogOpen(false)
    }

    const cellStyle = { padding: mobile ? theme.spacing(0.5) : theme.spacing(1) }
    const autoCellStyle = Object.assign({}, cellStyle, { width: 50 })

    return (
        <Grid container direction='column'>
            <Grid item>
                <Paper className={classes.spacing}>
                    <Title>Browse</Title>
                </Paper>
            </Grid>
            <Grid item className={clsx(classes.hovered, classes.spacingLeftRight)}>
                <Menu
                    id="actions-menu"
                    anchorEl={anchorEl}
                    keepMounted
                    open={Boolean(anchorEl)}
                    onClose={handleClose}
                >
                    <MenuItem onClick={() => { handleSelected('delete') }}>Delete</MenuItem>
                    <MenuItem onClick={() => { handleSelected('edit') }}>Edit</MenuItem>
                    <MenuItem onClick={() => { handleSelected('done') }}>Dealt with</MenuItem>
                </Menu>
                <DealtWithDialog item={menuRowData} open={dialogOpen} setResult={handleDialog}></DealtWithDialog>
                <ConfirmDialog title="Item removal"
                    descript="Please confirm action. You can restore item at any time using 'deleted' filter option."
                    open={confirmDialogOpen} onClose={handleConfirmDialogClose} />
                <MaterialTable
                    options={{
                        paging: false,
                        filtering: false,
                        headerStyle: autoCellStyle
                    }}
                    actions={actions}
                    columns={[
                        { title: 'Name', field: 'name', cellStyle },
                        { title: mobile ? 'Qt.' : "Quantity", field: 'quantity', cellStyle: autoCellStyle },
                        { title: 'Unit', field: 'unit', cellStyle: autoCellStyle },
                        { title: mobile ? 'Exp.' : "Expiration date", field: 'date', cellStyle }
                    ]}
                    localization={actionloc}
                    data={filteredData}
                    title=""
                    icons={tableIcons}
                    components={{
                        Toolbar: props => (
                            <Grid container direction='row' justify='space-between' alignItems='flex-end'>
                                <Grid item sm={3} xs={3} className={classes.spacing}>
                                    <InputLabel id="main-filter-label">Filter</InputLabel>
                                    <Select
                                        labelId="main-filter-label"
                                        id="main-filter"
                                        value={mainFilterValue}
                                        onChange={(event) => setMainFilterValue(event.target.value)}
                                    >
                                        <MenuItem value={itemTypes.ITEM_ACTIVE}>Active</MenuItem>
                                        <MenuItem value={itemTypes.ITEM_DONE}>Done</MenuItem>
                                        <MenuItem value={itemTypes.ITEM_REMOVED}>Deleted</MenuItem>
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