import React from 'react';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListSubheader from '@material-ui/core/ListSubheader';
import DashboardIcon from '@material-ui/icons/Dashboard';
import AddIcon from '@material-ui/icons/Add';
import ListAltOutlinedIcon from '@material-ui/icons/ListAltOutlined';

export const appBarItemsPrimary = (classes, props) => (
  <div>
    <ListItem button onClick={() => props.linkTo('/')} className={classes.menuBtn}>
      <ListItemIcon>
        <DashboardIcon />
      </ListItemIcon>
      <ListItemText primary="Home" />
    </ListItem>

    <ListItem button onClick={() => props.linkTo('/items')} className={classes.menuBtn}>
      <ListItemIcon>
        <ListAltOutlinedIcon />
      </ListItemIcon>
      <ListItemText primary="Browse" />
    </ListItem>

  </div>
);

export const appBarItemsSecondary = (classes, props) => (
  <div>
    <ListSubheader inset>Fast track</ListSubheader>
    <ListItem button onClick={props.handleAddNew}>
      <ListItemIcon>
        <AddIcon />
      </ListItemIcon>
      <ListItemText primary="Add" />
    </ListItem>
  </div>
);
