import React from 'react';
import IconButton from '@material-ui/core/IconButton';
//import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip'
import CheckBoxOutlineBlankIcon from '@material-ui/icons/CheckBoxOutlineBlank';
import Title from './Title';
import PropTypes from 'prop-types';
import SimpleDialog from './SimpleDialog'

/*const useStyles = makeStyles((theme) => ({

}))*/

function generateChoices(item) {
  let quantity = parseInt(item.quantity)
  let choices = []

  let s=''
  for(let i=1;i<=Math.min(3, quantity);i++) {
    choices.push(`${i} item${s}`)
    s='s'
  }

  if(quantity>3) {
    choices.push('More...')
  }
  
  choices.push('Cancel')

  return choices
}

function generateDialog(item, open, handleClose) {
  if(!item.quantity) {
    return null
  }

  if(!isNaN(item.quantity)) {
    return (
      <SimpleDialog open={open} onClose={handleClose} title="I've dealt with:" choices={generateChoices(item)} />
    )
  }
}

function ExpireSoonList(props) {
  //const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const handleDialogOpen = () => {
    setOpen(true);
  };

  const handleClose = (value) => {
    setOpen(false);
    props.handleRemove(value);
  };

  return (
    <React.Fragment>
      <Title>{props.title}</Title>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">Actions</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell align="right">Expiration</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.items.map((item) => (
            <TableRow hover key={item.id}>
              <TableCell padding="checkbox">
                <Tooltip title="dealt with" aria-label="dealt with">
                  <IconButton onClick={handleDialogOpen}>
                    <CheckBoxOutlineBlankIcon />
                  </IconButton>
                </Tooltip>
                {generateDialog(item, open, handleClose)}
              </TableCell>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell align="right">{item.datedescript}</TableCell>
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
  handleRemove: PropTypes.func
}

export default ExpireSoonList;