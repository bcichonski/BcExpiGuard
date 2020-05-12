import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import DashboardIcon from '@material-ui/icons/Dashboard';
import AddIcon from '@material-ui/icons/Add';
import { Link } from '@reach/router'
import ListAltOutlinedIcon from '@material-ui/icons/ListAltOutlined';

export const appBarItemsPrimary = (classes) => (
  <div>
    <Link to='/' className={classes.menuBtn}>
      <ListItem button>
        <ListItemIcon>
          <DashboardIcon />
        </ListItemIcon>
        <ListItemText primary="Home" />
      </ListItem>
    </Link>
    <Link to='/items' className={classes.menuBtn}>
      <ListItem button>
        <ListItemIcon>
          <ListAltOutlinedIcon />
        </ListItemIcon>
        <ListItemText primary="Browse" />
      </ListItem>
    </Link>
  </div>
);

export const appBarItemsSecondary = (classes, props) => (
  <div>
    <ListSubheader inset>Fast track</ListSubheader>
    <ListItem button onClick={props.handleAddNew}>
      <ListItemIcon>
        <AddIcon />
      </ListItemIcon>
      <ListItemText primary="Add new item" />
    </ListItem>
  </div>
);
