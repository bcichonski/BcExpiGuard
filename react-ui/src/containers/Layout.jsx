import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import MuiDrawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import { styled } from '@mui/material/styles';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import Copyright from '../components/Copyright';
import RouterSwitch from '../components/RouterSwitch';
import { appBarItemsPrimary, appBarItemsSecondary } from '../constants/appBarItems';
import { itemEditActions } from '../logic/item-edit-add';
import NavBar from '../components/NavBar'
import { drawerWidth } from '../constants/constants'
import MuiAlert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import { navigate } from "@reach/router"

// Permanent drawer that is wide when open and collapses to an icon rail (or nothing on mobile) when closed.
const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'isMobile' })(
  ({ theme, open, isMobile }) => ({
    '& .MuiDrawer-paper': {
      position: 'relative',
      whiteSpace: 'nowrap',
      width: drawerWidth(isMobile),
      transition: theme.transitions.create('width', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.enteringScreen,
      }),
      ...(!open && {
        overflowX: 'hidden',
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
        // v4 also had an up('sm') 72px rule, but its prop-driven width (a later dynamic JSS sheet) always won,
        // so the rendered rail was 56px (0 on mobile). Keep what was rendered.
        width: isMobile ? theme.spacing(0) : theme.spacing(7),
      }),
    },
  })
);

const ToolbarIcon = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: '0 8px',
  ...theme.mixins.toolbar,
}));

const AppBarSpacer = styled('div')(({ theme }) => theme.mixins.toolbar);

const Content = styled('main')({
  flexGrow: 1,
  height: '100vh',
  overflow: 'auto',
});

const AlertSpacer = styled('div')(({ theme }) => ({
  width: '100%',
  '& > * + *': {
    marginTop: theme.spacing(2),
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
    <Box sx={{ display: 'flex' }}>
      <NavBar open={open} handleDrawerOpen={handleDrawerOpen} isMobile={props.isMobile}/>
      <Drawer variant="permanent" open={open} isMobile={props.isMobile}>
        <ToolbarIcon>
          <IconButton onClick={handleDrawerClose} aria-label="close drawer">
            <ChevronLeftIcon />
          </IconButton>
        </ToolbarIcon>
        <Divider />
        <List>{appBarItemsPrimary(listProps)}</List>
        <Divider />
        <List>{appBarItemsSecondary(listProps)}</List>
      </Drawer>
      <Content>
        <AlertSpacer>
          <Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleAlertClose}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
            <Alert onClose={handleAlertClose} severity="error">
              {props.errorMessage}
            </Alert>
          </Snackbar>
        </AlertSpacer>
        <AppBarSpacer />
        <Container maxWidth="xl" sx={{ pt: 4, pb: 4 }}>
          <RouterSwitch history={props.history} />
          <Box pt={4}>
            <Copyright />
          </Box>
        </Container>
      </Content>
    </Box>
  );
}

Layout.propTypes = {
  isMobile: PropTypes.bool,
  history: PropTypes.object
}

export default connect(mapStateToProps, mapDispatchToProps)(Layout)