import React from "react";
import { Fragment } from 'react'
import { useAuth0 } from "../common/auth0";
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import MenuIcon from '@material-ui/icons/Menu';
//import NotificationsIcon from '@material-ui/icons/Notifications';
import AppBar from '@material-ui/core/AppBar';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import { drawerWidth } from '../constants/constants'
import PropTypes from 'prop-types';
import AccountCircleIcon from '@material-ui/icons/AccountCircle';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Avatar from '@material-ui/core/Avatar';
import AccountBoxOutlinedIcon from '@material-ui/icons/AccountBoxOutlined';
import { navigate } from "@reach/router"
import SyncState from "./SyncState";
import { connect } from 'react-redux'
import MoreVertIcon from '@material-ui/icons/MoreVert';
import Tooltip from '@material-ui/core/Tooltip'

const StyledMenu = withStyles({
  paper: {
    border: '1px solid #d3d4d5',
  },
})((props) => (
  <Menu
    elevation={0}
    getContentAnchorEl={null}
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
));

const StyledMenuItem = withStyles((theme) => ({
  root: {
    '&:focus': {
      backgroundColor: theme.palette.primary.main,
      '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
        color: theme.palette.common.white,
      },
    },
  },
}))(MenuItem);


const useStyles = makeStyles((theme) => ({
  appBar: {
    zIndex: theme.zIndex.drawer + 1,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    marginLeft: (props) => drawerWidth(props.isMobile),
    width: props => `calc(100% - ${drawerWidth(props.isMobile)}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  toolbar: {
    paddingRight: 24, // keep right padding when drawer closed
  },
  toolbarIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: '0 8px',
    ...theme.mixins.toolbar,
  },
  menuButton: {
    marginRight: 36
  },
  menuButtonHidden: {
    display: 'none',
  },
  title: {
    flexGrow: 1,
  },
  button: {
    margin: theme.spacing(1),
  },
}))

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
  const classes = useStyles({isMobile: props.isMobile});
  const { isAuthenticated, loginWithRedirect, logout, user } = useAuth0();
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
        <span className={classes.toolbar}>
          <SyncState state={props.state} hint={props.hint} />
        </span>
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
          className={classes.button}
          onClick={() => loginWithRedirect({})}
          startIcon={<AccountCircleIcon />}
        >
          Log in
      </Button>
      </Fragment>
    )
  }


  return (
    <AppBar position="absolute" className={clsx(classes.appBar, props.open && classes.appBarShift)}>
      <Toolbar className={classes.toolbar}>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="open drawer"
          onClick={props.handleDrawerOpen}
          className={clsx(classes.menuButton, props.open && classes.menuButtonHidden)}
        >
          <MenuIcon />
        </IconButton>
        <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
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