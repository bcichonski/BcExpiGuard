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
import { changedLastQuarter } from '../common/utils'

const useStyles = makeStyles((theme) => ({
  striked: {
    textDecorationLine: 'line-through'
  },
  half: {
    width: '50%'
  },
  quater: {
    width: '25%'
  },
  nopadding: props => ({
    padding: props.mobile ? 0 : theme.spacing(1)
  }),
  verysmallpadding: props => ({
    padding: props.mobile ? theme.spacing(0.5) : theme.spacing(1)
  })
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
    <TableCell className={props.classes.nopadding}>
      {actions}
      <DealtWithDialog item={props.item} open={open} setResult={handleClose}></DealtWithDialog>
    </TableCell>
  )
}

function ExpireSoonList(props) {
  const theme = useTheme()
  const mobile = useMediaQuery(theme.breakpoints.down('sm'));
  const classes = useStyles({ mobile });
  const today = new Date()

  let header
  if (props.showHeader) {
    header = (
      <TableHead>
        <TableRow>
          <TableCell className={classes.nopadding}></TableCell>
          <TableCell className={clsx(classes.half, classes.verysmallpadding)}>Name</TableCell>
          <TableCell className={clsx(classes.quater, classes.verysmallpadding)} align="right">{mobile ? "Qt." : "Quantity"}</TableCell>
          <TableCell className={clsx(classes.quater, classes.verysmallpadding)}>Unit</TableCell>
          <TableCell className={clsx(classes.quater, classes.verysmallpadding)} align="right">{mobile ? "Exp." : "Expiration"}</TableCell>
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
              <ActionsWithDialogs item={item}
                handleRemove={props.handleRemove}
                handleUndo={props.handleUndo}
                classes={classes}
                today={today}></ActionsWithDialogs>
              <TableCell className={clsx(classes.half, classes.verysmallpadding)}>{item.name}</TableCell>
              <TableCell className={clsx(classes.quater, classes.verysmallpadding)} align="right">{item.quantity}</TableCell>
              <TableCell className={clsx(classes.quater, classes.verysmallpadding)} align="left">{item.unit}</TableCell>
              <TableCell className={clsx(classes.quater, classes.verysmallpadding)} align="right">{item.datedescript}</TableCell>
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