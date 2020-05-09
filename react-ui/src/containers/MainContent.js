import React from 'react';
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import Chart from '../components/Chart';
import Deposits from '../components/Deposits';
import Orders from '../components/Orders';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import { itemEditActions } from '../logic/item-edit-add'
import { connect } from 'react-redux';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    display: 'flex',
    overflow: 'auto',
    flexDirection: 'column',
  },
  fixedHeight: {
    height: 240,
  },
  floatRight: {
    position: 'fixed',
    marginRight: theme.spacing(1),
    marginBottom: theme.spacing(1),
    right: theme.spacing(2),
    bottom: theme.spacing(1)
  }
}));

const mapStateToProps = (state /*, ownProps*/) => {
  return { }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  handleAddNew : () => dispatch(itemEditActions.itemInCreation)
})

function MainContent(props) {
  const classes = useStyles();
  const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight);

  return (
    <div>
      <Grid container spacing={3}>
        {/* Chart */}
        <Grid item xs={12} md={8} lg={9}>
          <Paper className={fixedHeightPaper}>
            <Chart />
          </Paper>
        </Grid>
        {/* Recent Deposits */}
        <Grid item xs={12} md={4} lg={3}>
          <Paper className={fixedHeightPaper}>
            <Deposits />
          </Paper>
        </Grid>
        {/* Recent Orders */}
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Orders />
          </Paper>
        </Grid>
      </Grid>
      <Fab color="primary" aria-label="add" className={classes.floatRight} onClick={props.handleAddNew}>
        <AddIcon />
      </Fab>
    </div>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(MainContent)