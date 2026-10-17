import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';

const menuBtnSx = { textDecoration: 'none', color: 'text.primary' };

export const appBarItemsPrimary = (props) => (
  <div>
    <ListItemButton onClick={() => props.linkTo('/')} sx={menuBtnSx}>
      <ListItemIcon>
        <DashboardIcon />
      </ListItemIcon>
      <ListItemText primary="Home" />
    </ListItemButton>

    <ListItemButton onClick={() => props.linkTo('/items')} sx={menuBtnSx}>
      <ListItemIcon>
        <ListAltOutlinedIcon />
      </ListItemIcon>
      <ListItemText primary="Browse" />
    </ListItemButton>

  </div>
);

export const appBarItemsSecondary = (props) => (
  <div>
    <ListSubheader inset>Fast track</ListSubheader>
    <ListItemButton onClick={props.handleAddNew}>
      <ListItemIcon>
        <AddIcon />
      </ListItemIcon>
      <ListItemText primary="Add" />
    </ListItemButton>
  </div>
);
