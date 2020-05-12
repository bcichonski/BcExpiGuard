import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import Title from './Title';
import PropTypes from 'prop-types';
import ChoiceDialog from './ChoiceDialog'
import ConfirmDialog from './ConfirmDialog'
import InputDialog from './InputDialog'
import clsx from 'clsx';
import { itemTypes } from '../logic/item-list'
import UndoIcon from '@material-ui/icons/Undo';

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

function generateChoices(item) {
  let quantity = parseInt(item.quantity)
  let choices = []

  let s = ''
  for (let i = 1; i <= Math.min(3, quantity); i++) {
    choices.push({
      id: i.toString(),
      name: `${i} item${s}`
    })
    s = 's'
  }

  if (quantity > 3) {
    choices.push({
      id: 'more',
      name: 'More...'
    })
  }

  choices.push({
    id: 'cancel',
    name: 'Cancel'
  })

  return choices
}

function generateDialog(item, open, handleClose) {
  if (!item.quantity) {
    return (
      <ConfirmDialog title={item.name} descript="Please confirm it's done" open={open} onClose={handleClose} />
    )
  }

  if (!isNaN(item.quantity)) {
    return (
      <ChoiceDialog open={open} onClose={handleClose} title="How many?" choices={generateChoices(item)} />
    )
  } else {
    return (
      <InputDialog title={item.name}
        descript='Please enter how many were left.'
        inputLabel='If none, leave this input blank' open={open} onClose={handleClose}
        value={item.quantity} />
    )
  }
}

function ActionsWithDialogs(props) {
  const [open, setOpen] = React.useState(false)

  const handleDialogOpen = () => {
    setOpen(true);
  };

  const handleClose = (value) => {
    setOpen(false);
    props.handleRemove(props.item.id, value);
  };

  const handleUndo = () => {
    props.handleUndo(props.item.id)
  }

  const actions = []
  if (props.item.state === itemTypes.ITEM_ACTIVE) {
    actions.push((<Tooltip key={`${props.item.id}-done`} title="dealt with" aria-label="dealt with">
      <IconButton onClick={handleDialogOpen}>
        <CheckBoxOutlineBlankIcon />
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
      {generateDialog(props.item, open, handleClose)}
    </TableCell>
  )
}

function ExpireSoonList(props) {
  const classes = useStyles();

  let header
  if (props.showHeader) {
    header = (
      <TableHead>
        <TableRow>
          <TableCell padding="checkbox" ></TableCell>
          <TableCell className={classes.half}>Name</TableCell>
          <TableCell className={classes.quater}>Quantity</TableCell>
          <TableCell className={classes.quater} align="right">Expiration</TableCell>
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
              <TableCell className={classes.quater}>{item.quantity}</TableCell>
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
    datedescript: PropTypes.string,
    quantity: PropTypes.string
  })),
  handleRemove: PropTypes.func,
  handleUndo: PropTypes.func,
  showHeader: PropTypes.bool
}

export default ExpireSoonList;