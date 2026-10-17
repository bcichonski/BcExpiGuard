import React from "react";
import { Fragment } from 'react'
import { useAuth0 } from "@auth0/auth0-react";
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import MenuIcon from '@mui/icons-material/Menu';
import MuiAppBar from '@mui/material/AppBar';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import { drawerWidth } from '../constants/constants'
import PropTypes from 'prop-types';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
import AccountBoxOutlinedIcon from '@mui/icons-material/AccountBoxOutlined';
import { useNavigate } from "react-router"
import SyncState from "./SyncState";
import { connect } from 'react-redux'
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Tooltip from '@mui/material/Tooltip'

const StyledMenu = styled((props) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'center',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'center',
    }}
    {...props}
  />
))({
  '& .MuiMenu-paper': {
    border: '1px solid #d3d4d5',
  },
});

const StyledMenuItem = styled(MenuItem)(({ theme }) => ({
  '&:focus': {
    backgroundColor: theme.palette.primary.main,
    '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
      color: theme.palette.common.white,
    },
  },
}));

// Sits above the drawer; when the drawer opens it shifts right and narrows by the drawer width.
const AppBar = styled(MuiAppBar, { shouldForwardProp: (prop) => prop !== 'open' && prop !== 'isMobile' })(
  ({ theme, open, isMobile }) => ({
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
      marginLeft: drawerWidth(isMobile),
      width: `calc(100% - ${drawerWidth(isMobile)}px)`,
      transition: theme.transitions.create(['width', 'margin'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
    }),
  })
);

function getHintFromState(state) {
  if (state === 'ok') {
    return 'Sync is active'
  }
  if (state === 'disabled') {
    return 'Sync is disabled'
  }
  if (state === 'error') {
    return 'There was problems with syncing'
  }
  if (state === 'changed') {
    return 'Changes were synced'
  }
}

const mapStateToProps = (state, ownProps) => ({
  state: state.appStateReducer.syncState ?? 'ok',
  hint: getHintFromState(state.appStateReducer.syncState ?? 'ok'),
  ...ownProps,
})

const NavBar = (props) => {
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuItemClick = (event, index) => {
    if (index === 'profile') {
      navigate('/profile')
    } else {
      logout()
    }
    setAnchorEl(null);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  let authWidget = null
  if (isAuthenticated) {
    authWidget = (
      <Fragment>
        <Box component="span" sx={{ pr: 3 }}>
          <SyncState state={props.state} hint={props.hint} />
        </Box>
        <Tooltip title={user.name} id='login_tooltip'>
          <Button
            id = 'account_button'
            onClick={handleClick}
            color="secondary"
            variant="contained"
            startIcon={
              <Avatar alt={user.name} src={user.picture} />
            }
            endIcon={<MoreVertIcon />}
          >
          </Button>
        </Tooltip>
        <StyledMenu
          id="user-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <StyledMenuItem onClick={(event) => handleMenuItemClick(event, 'profile')}>
            <ListItemIcon>
              <AccountBoxOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Profile" />
          </StyledMenuItem>
          <StyledMenuItem onClick={(event) => handleMenuItemClick(event, 'logout')}>
            <ListItemIcon>
              <ExitToAppIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Log out" />
          </StyledMenuItem>
        </StyledMenu>
      </Fragment>
    )
  } else {
    authWidget = (
      <Fragment>
        <Button
          variant="contained"
          color="secondary"
          size="small"
          sx={{ m: 1 }}
          onClick={() => loginWithRedirect({})}
          startIcon={<AccountCircleIcon />}
        >
          Log in
      </Button>
      </Fragment>
    )
  }


  return (
    <AppBar position="absolute" open={props.open} isMobile={props.isMobile}>
      <Toolbar sx={{ pr: 3 }}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={props.handleDrawerOpen}
          sx={{ mr: '36px', ...(props.open && { display: 'none' }) }}
        >
          <MenuIcon />
        </IconButton>
        <Typography component="h1" variant="h6" color="inherit" noWrap sx={{ flexGrow: 1 }}>
          ExpiGuard
      </Typography>
        {authWidget}
      </Toolbar>
    </AppBar>
  );
};

NavBar.propTypes = {
  open: PropTypes.bool,
  handleDrawerOpen: PropTypes.func,
  isMobile: PropTypes.bool
}

export default connect(mapStateToProps, null)(NavBar);