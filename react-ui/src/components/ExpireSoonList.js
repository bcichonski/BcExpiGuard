import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Title from './Title';
import PropTypes from 'prop-types';

// Generate Order Data
function createData(id, name, quantity, datedescript) {
  return { id, name, quantity, datedescript };
}

const rows = [
  createData('abac', 'Parsley', '2', 'today'),
  createData('abbc', 'Bread', '3', 'tommorow'),
  createData('adbc', 'Pasta', '', 'in 3 days'),
  createData('a2bc', 'Driving license', '', '2021-01-01'),
];

function ExpireSoonList(props) {
  //const classes = useStyles();
  return (
    <React.Fragment>
      <Title>{props.title}</Title>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox"></TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell align="right">Expiration</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {props.items.map((item) => (
            <TableRow key={item.id}>
              <TableCell padding="checkbox">
                <IconButton aria-label="delete">
                  <DeleteIcon />
                </IconButton>
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
    quantity: PropTypes.number
  })),
  handleRemove: PropTypes.func
}

ExpireSoonList.defaultProps = {
  items: rows
}

export default ExpireSoonList;