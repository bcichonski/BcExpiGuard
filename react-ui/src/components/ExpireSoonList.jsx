import React from 'react';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip'
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import Title from './Title';
import PropTypes from 'prop-types';
import { itemTypes } from '../logic/item-list'
import UndoIcon from '@mui/icons-material/Undo';
import useMediaQuery from '@mui/material/useMediaQuery';
import DealtWithDialog from './DealtWithDialog'
import { changedLastQuarter } from '../common/utils'

const struckStyle = { textDecorationLine: 'line-through' }

// Cell sizing: the v4 JSS classes half / quater / nopadding / verysmallpadding, as sx objects.
const cellSx = (theme, mobile, width) => ({
  width,
  padding: mobile ? theme.spacing(0.5) : theme.spacing(1),
})

function ActionsWithDialogs(props) {
  const [open, setOpen] = React.useState(false)

  const handleDialogOpen = () => {
    setOpen(true)
  }

  const handleClose = (item, value) => {
    setOpen(false);
    props.handleRemove(item, value);
  }

  const handleUndo = () => {
    props.handleUndo(props.item.id)
  }

  const actions = []
  if (!!props.item.previousQuantity && changedLastQuarter(props.item, props.today)) {
    actions.push(
      <Tooltip title="undo" key={`${props.item.id}-undo`} aria-label="undo">
        <IconButton onClick={handleUndo}>
          <UndoIcon />
        </IconButton>
      </Tooltip>)
  } else {
    actions.push((<Tooltip key={`${props.item.id}-done`} title="dealt with" aria-label="dealt with">
      <IconButton onClick={handleDialogOpen}>
        <AssignmentTurnedInOutlinedIcon />
      </IconButton>
    </Tooltip>))
  }

  return (
    <TableCell sx={(theme) => ({ padding: props.mobile ? 0 : theme.spacing(1) })}>
      {actions}
      <DealtWithDialog item={props.item} open={open} setResult={handleClose}></DealtWithDialog>
    </TableCell>
  )
}

function ExpireSoonList(props) {
  const theme = useTheme()
  // v4 down('sm') (< 960px) is down('md') with the app's v4 breakpoint values
  const mobile = useMediaQuery(theme.breakpoints.down('md'));
  const today = new Date()

  let header
  if (props.showHeader) {
    header = (
      <TableHead>
        <TableRow>
          <TableCell sx={(theme) => ({ padding: mobile ? 0 : theme.spacing(1) })}></TableCell>
          <TableCell sx={(theme) => cellSx(theme, mobile, '50%')}>Name</TableCell>
          <TableCell sx={(theme) => cellSx(theme, mobile, '25%')} align="right">{mobile ? "Qt." : "Quantity"}</TableCell>
          <TableCell sx={(theme) => cellSx(theme, mobile, '25%')}>Unit</TableCell>
          <TableCell sx={(theme) => cellSx(theme, mobile, '25%')} align="right">{mobile ? "Exp." : "Expiration"}</TableCell>
        </TableRow>
      </TableHead>
    )
  }

  return (
    <React.Fragment>
      <Title>{props.title}</Title>
      <Table size="small">
        {header}
        <TableBody>
          {props.items.map((item) => (
            <TableRow hover key={item.id} sx={item.state === itemTypes.ITEM_DONE ? struckStyle : undefined}>
              <ActionsWithDialogs item={item}
                handleRemove={props.handleRemove}
                handleUndo={props.handleUndo}
                mobile={mobile}
                today={today}></ActionsWithDialogs>
              <TableCell sx={(theme) => cellSx(theme, mobile, '50%')}>{item.name}</TableCell>
              <TableCell sx={(theme) => cellSx(theme, mobile, '25%')} align="right">{item.quantity}</TableCell>
              <TableCell sx={(theme) => cellSx(theme, mobile, '25%')} align="left">{item.unit}</TableCell>
              <TableCell sx={(theme) => cellSx(theme, mobile, '25%')} align="right">{item.datedescript}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </React.Fragment>
  );
}

ExpireSoonList.propTypes = {
  title: PropTypes.string,
  titleColor: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    unit: PropTypes.string,
    datedescript: PropTypes.string,
    quantity: PropTypes.string
  })),
  handleRemove: PropTypes.func,
  handleUndo: PropTypes.func,
  showHeader: PropTypes.bool
}

export default ExpireSoonList;