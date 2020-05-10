import React from 'react';
import IconButton from '@material-ui/core/IconButton';
import DoneIcon from '@material-ui/icons/Done';
import { makeStyles } from '@material-ui/core/styles';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Tooltip from '@material-ui/core/Tooltip'
import Title from './Title';
import PropTypes from 'prop-types';

function ExpireSoonList(props) {
  //const classes = useStyles();
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
            <TableRow key={item.id}>
              <TableCell padding="checkbox">
                <Tooltip title="dealt with" aria-label="dealt with">
                <IconButton>
                  <DoneIcon />
                </IconButton>
                </Tooltip>
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