import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip'
import AssignmentTurnedInOutlinedIcon from '@material-ui/icons/AssignmentTurnedInOutlined';
import Title from './Title';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { itemTypes } from '../logic/item-list'
import UndoIcon from '@material-ui/icons/Undo';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useTheme } from '@material-ui/core/styles';
import DealtWithDialog from './DealtWithDialog'

const useStyles = makeStyles((theme) => ({
  striked: {
    textDecorationLine: 'line-through'
  },
  half: {
    width: '50%'
  },
  quater: {
    width: '25%'
  }
}))



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
  if (props.item.state === itemTypes.ITEM_ACTIVE) {
    actions.push((<Tooltip key={`${props.item.id}-done`} title="dealt with" aria-label="dealt with">
      <IconButton onClick={handleDialogOpen}>
        <AssignmentTurnedInOutlinedIcon />
      </IconButton>
    </Tooltip>))
  } else {
    actions.push(
      <Tooltip title="undo" key={`${props.item.id}-undo`} aria-label="undo">
        <IconButton onClick={handleUndo}>
          <UndoIcon />
        </IconButton>
      </Tooltip>)
  }

  return (
    <TableCell padding="checkbox">
      {actions}
      <DealtWithDialog item={props.item} open={open} setResult={handleClose}></DealtWithDialog>
    </TableCell>
  )
}

function ExpireSoonList(props) {
  const classes = useStyles();

  const theme = useTheme()
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));

  let header
  if (props.showHeader) {
    header = (
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox" ></TableCell>
          <TableCell className={classes.half}>Name</TableCell>
          <TableCell className={classes.quater} align="right">{mobile ? "Qt." : "Quantity"}</TableCell>
          <TableCell className={classes.quater}>Unit</TableCell>
          <TableCell className={classes.quater} align="right">{mobile ? "Exp." : "Expiration"}</TableCell>
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
            <TableRow hover key={item.id} className={clsx(item.state === itemTypes.ITEM_DONE && classes.striked)}>
              <ActionsWithDialogs item={item} handleRemove={props.handleRemove} handleUndo={props.handleUndo}></ActionsWithDialogs>
              <TableCell className={classes.half}>{item.name}</TableCell>
              <TableCell className={classes.quater} align="right">{item.quantity}</TableCell>
              <TableCell className={classes.quater} align="left">{item.unit}</TableCell>
              <TableCell className={classes.quater} align="right">{item.datedescript}</TableCell>
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