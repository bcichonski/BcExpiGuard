import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { styled, useTheme } from '@mui/material/styles';
import { DataGrid, QuickFilter, QuickFilterClear, QuickFilterControl } from '@mui/x-data-grid';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import SearchIcon from '@mui/icons-material/Search';
import ConfirmDialog from '../components/ConfirmDialog'
import DealtWithDialog from '../components/DealtWithDialog'
import Title from '../components/Title'
import { itemActions, itemTypes } from '../logic/item-list'
import { itemEditActions } from '../logic/item-edit-add';
import syncMonkey from '../common/syncMonkey'

// The MIT DataGrid caps the page size at 100; the old table showed every row unpaged.
const PAGE_SIZE = 100
const PAGE_SIZE_OPTIONS = [25, 50, 100]

const TitlePaper = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(2),
    flexGrow: 1,
    overflow: 'auto',
}));

// The old table searched for the whole typed text (case-insensitive, in any column); the DataGrid's
// default parser would split it into words that must each match.
const quickFilterParser = (input) => (input === '' ? [] : [input])

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

// Grid toolbar: the state filter on the left, the grid's quick-filter search box on the right
// (the old table layout: Filter select + search box).
function BrowseToolbar(props) {
    const { filterValue, onFilterChange, mobile } = props
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            pt: 3,
            pb: 2,
            pl: 4,
            pr: 5,
        }}>
            <div>
                <InputLabel id="main-filter-label">Filter</InputLabel>
                <Select
                    labelId="main-filter-label"
                    id="main-filter"
                    value={filterValue}
                    onChange={(event) => onFilterChange(event.target.value)}
                >
                    <MenuItem value={itemTypes.ITEM_ACTIVE}>Active</MenuItem>
                    <MenuItem value={itemTypes.ITEM_DONE}>Done</MenuItem>
                    <MenuItem value={itemTypes.ITEM_REMOVED}>Deleted</MenuItem>
                    <MenuItem value='none'>None</MenuItem>
                </Select>
            </div>
            <QuickFilter expanded parser={quickFilterParser}>
                <QuickFilterControl
                    render={({ ref, ...controlProps }, state) => (
                        <TextField
                            {...controlProps}
                            inputRef={ref}
                            variant="standard"
                            placeholder="Search"
                            sx={{ width: mobile ? 137 : 287 }}
                            slotProps={{
                                ...controlProps.slotProps,
                                htmlInput: { ...controlProps.slotProps?.htmlInput, 'aria-label': 'Search' },
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <QuickFilterClear
                                                render={<IconButton size="small" aria-label="Clear search" disabled={!state.value} />}
                                            >
                                                <ClearIcon fontSize="small" />
                                            </QuickFilterClear>
                                        </InputAdornment>
                                    ),
                                },
                            }}
                        />
                    )}
                />
            </QuickFilter>
        </Box>
    )
}

BrowseToolbar.propTypes = {
    filterValue: PropTypes.string.isRequired,
    onFilterChange: PropTypes.func.isRequired,
    mobile: PropTypes.bool,
}

function BrowseItems(props) {
    const theme = useTheme()
    // v4 down('sm') (< 960px) is down('md') with the app's v4 breakpoint values
    const mobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mainFilterValue, setMainFilterValue] = useState(itemTypes.ITEM_ACTIVE)
    const [menuRowData, setMenuRowData] = React.useState(null);
    const filteredData = props.data.filter((item) => mainFilterValue === 'none' || item.state === mainFilterValue)

    syncMonkey.reset()

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

    const rowAction = (action, row) => {
        setMenuRowData(row)
        handleSelected(action, row)
    }

    const renderActions = ({ row }) => {
        if (mobile) {
            return (
                <Tooltip title="Actions">
                    <IconButton color="inherit" aria-label="Actions" onClick={(event) => {
                        setMenuRowData(row)
                        handleClick(event)
                    }}>
                        <MoreVertOutlinedIcon />
                    </IconButton>
                </Tooltip>
            )
        }
        return (
            <React.Fragment>
                <Tooltip title="Delete">
                    <IconButton color="inherit" aria-label="Delete" onClick={() => rowAction('delete', row)}>
                        <DeleteOutlineIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Edit">
                    <IconButton color="inherit" aria-label="Edit" onClick={() => rowAction('edit', row)}>
                        <EditOutlinedIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Dealt with">
                    <IconButton color="inherit" aria-label="Dealt with" onClick={() => rowAction('done', row)}>
                        <AssignmentTurnedInOutlinedIcon />
                    </IconButton>
                </Tooltip>
            </React.Fragment>
        )
    }

    // Equal shares on desktop; on mobile Name gets more room, as the old auto-sized table gave it.
    const columns = [
        {
            field: 'actions',
            headerName: mobile ? '' : 'Actions',
            width: mobile ? 56 : 152,
            sortable: false,
            filterable: false,
            headerAlign: 'center',
            renderCell: renderActions,
            cellClassName: 'browse-actions-cell',
        },
        { field: 'name', headerName: 'Name', flex: mobile ? 1.5 : 1, minWidth: 0 },
        { field: 'quantity', headerName: mobile ? 'Qt.' : 'Quantity', flex: 1, minWidth: 0 },
        { field: 'unit', headerName: 'Unit', flex: 1, minWidth: 0 },
        { field: 'date', headerName: mobile ? 'Exp.' : 'Expiration date', flex: 1, minWidth: 0 },
    ]

    const cellPadding = mobile ? theme.spacing(0.5) : theme.spacing(1)

    return (
        <Grid container direction='column'>
            <Grid size={12}>
                <TitlePaper>
                    <Title>Browse</Title>
                </TitlePaper>
            </Grid>
            <Grid size={12}>
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
                <Paper elevation={2}>
                    <DataGrid
                        rows={filteredData}
                        columns={columns}
                        autoHeight
                        getRowHeight={() => 'auto'}
                        columnHeaderHeight={mobile ? 36 : 40}
                        showToolbar
                        slots={{ toolbar: BrowseToolbar }}
                        slotProps={{
                            toolbar: { filterValue: mainFilterValue, onFilterChange: setMainFilterValue, mobile },
                        }}
                        initialState={{ pagination: { paginationModel: { pageSize: PAGE_SIZE } } }}
                        pageSizeOptions={PAGE_SIZE_OPTIONS}
                        disableColumnMenu
                        disableColumnResize
                        disableColumnSelector
                        disableDensitySelector
                        disableRowSelectionOnClick
                        sx={{
                            border: 0,
                            '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell': {
                                px: cellPadding,
                            },
                            '& .MuiDataGrid-cell': {
                                py: cellPadding,
                                display: 'flex',
                                alignItems: 'center',
                                whiteSpace: 'normal',
                                overflowWrap: 'break-word',
                            },
                            '& .MuiDataGrid-cell.browse-actions-cell': {
                                p: 0,
                                justifyContent: 'center',
                            },
                            // The old table had no cell/header focus ring; the action buttons keep their own.
                            '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within, & .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
                                outline: 'none',
                            },
                            '& .MuiDataGrid-columnSeparator': {
                                display: 'none',
                            },
                        }}
                    />
                </Paper>
            </Grid>
        </Grid>
    )
}

BrowseItems.propTypes = {
    data: PropTypes.arrayOf(PropTypes.object).isRequired,
    handleDialogDone: PropTypes.func.isRequired,
    handleItemRemoval: PropTypes.func.isRequired,
    handleItemEdit: PropTypes.func.isRequired,
}

export default connect(mapStateToProps, mapDispatchToProps)(BrowseItems);
