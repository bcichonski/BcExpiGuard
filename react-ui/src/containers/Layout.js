import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import { makeStyles } from '@material-ui/core/styles';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Copyright from '../components/Copyright';
import RouterSwitch from '../components/RouterSwitch';
import { appBarItemsPrimary, appBarItemsSecondary } from '../constants/appBarItems';
import { itemEditActions } from '../logic/item-edit-add';
import NavBar from '../components/NavBar'
import { drawerWidth } from '../constants/constants'
import MuiAlert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import { navigate } from "@reach/router"

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
  },
  drawerPaper: {
    position: 'relative',
    whiteSpace: 'nowrap',
    width: drawerWidth,
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  drawerPaperClose: {
    overflowX: 'hidden',
    transition: theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    width: props => props.isMobile ? theme.spacing(0) : theme.spacing(7),
    [theme.breakpoints.up('sm')]: {
      width: theme.spacing(9),
    },
  },
  appBarSpacer: theme.mixins.toolbar,
  content: {
    flexGrow: 1,
    height: '100vh',
    overflow: 'auto',
  },
  container: {
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
  },
  menuBtn: {
    textDecoration: 'none',
    color: theme.palette.text.primary
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
  alertSpacer: {
    width: '100%',
    '& > * + *': {
      marginTop: theme.spacing(2),
    },
  },
}));

const mapStateToProps = (state) => ({
  errorMessage: state.appStateReducer.lastError,
  alertShouldBeOpen: !!state.appStateReducer.lastError
})

const mapDispatchToProps = (dispatch, ownProps) => ({
  ...ownProps,
  handeAddNewInternal: () => dispatch(itemEditActions.itemInCreation)
})

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

function Layout(props) {
  const classes = useStyles(props);

  const [open, setOpen] = React.useState(false);
  const handleDrawerOpen = () => {
    setOpen(true);
  };
  const handleDrawerClose = () => {
    setOpen(false);
  };

  const [alertOpen, setAlertOpen] = React.useState(props.alertShouldBeOpen);
  const handleAlertClose = () => {
    setAlertOpen(false);
  }

  const listProps = Object.assign({}, props, {
    linkTo: (link) => {
      navigate(link)
      if (props.isMobile) {
        handleDrawerClose()
      }
    },
    handleAddNew: () => {
      props.handeAddNewInternal()
      if (props.isMobile) {
        handleDrawerClose()
      }
    }
  })

  return (
    <div className={classes.root}>
      <CssBaseline />
      <NavBar open={open} handleDrawerOpen={handleDrawerOpen} />
      <Drawer
        variant="permanent"
        classes={{
          paper: clsx(classes.drawerPaper, !open && classes.drawerPaperClose),
        }}
        open={open}
      >
        <div className={classes.toolbarIcon}>
          <IconButton onClick={handleDrawerClose}>
            <ChevronLeftIcon />
          </IconButton>
        </div>
        <Divider />
        <List className={classes.appBarNav}>{appBarItemsPrimary(classes, listProps)}</List>
        <Divider />
        <List className={classes.appBarNav}>{appBarItemsSecondary(classes, listProps)}</List>
      </Drawer>
      <main className={classes.content}>
        <div className={classes.alertSpacer} >
          <Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleAlertClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
            <Alert onClose={handleAlertClose} severity="error">
              {props.errorMessage}
            </Alert>
          </Snackbar>
        </div>
        <div className={classes.appBarSpacer} />
        <Container maxWidth="xl" className={classes.container}>
          <RouterSwitch history={props.history} />
          <Box pt={4}>
            <Copyright />
          </Box>
        </Container>
      </main>
    </div>
  );
}

Layout.propTypes = {
  isMobile: PropTypes.bool,
  history: PropTypes.object
}

export default connect(mapStateToProps, mapDispatchToProps)(Layout)