import React, { Fragment } from 'react';
//import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Paper';
import ExpireSoonList from '../components/ExpireSoonList';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import { itemEditActions } from '../logic/item-edit-add'
import { itemActions, itemTypes } from '../logic/item-list'
import { connect } from 'react-redux';
import { parseISO, differenceInDays, formatDistanceToNow, isPast, isToday, compareAsc } from 'date-fns'
import Title from '../components/Title'
import syncMonkey from '../common/syncMonkey'
import { changedLastQuarter } from '../common/utils'

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

function onlyNotRemoved(item) {
  return item.state !== itemTypes.ITEM_REMOVED;
}

function onlyActive(item) {
  return onlyNotRemoved(item) && item.state !== itemTypes.ITEM_DONE;
}

function onlyExpired() {
  return (item) => item.daydiff < 0
}

function onlyExpiresWithinDays(from, to) {
  return (item) => {
    return item.daydiff >= from && item.daydiff < to
  }
}

function normalize(collection, state, today) {
  return collection
    .filter(item => (onlyActive(item) || changedLastQuarter(item, today)))
    .map(item => ({
      ...item,
      daydiff: differenceInDays(parseISO(item.date), today),
      name: state.itemNameReducer
        .find(nm => nm.id === item.nameID)?.name ?? item.nameID
    }))
    .sort((a, b) => compareAsc(a.daydiff, b.daydiff))
}

const mapStateToProps = (state, ownProps) => {
  const today = new Date()
  const expired = normalize(state.itemReducer, state, today)
    .filter(onlyExpired())
  const expiresToday = normalize(state.itemReducer, state, today)
    .filter(onlyExpiresWithinDays(0, 1))
  const expiresInAWeek = normalize(state.itemReducer, state, today)
    .filter(onlyExpiresWithinDays(1, 7))
  const expiresInAMonth = normalize(state.itemReducer, state, today)
    .filter(onlyExpiresWithinDays(7, 30))

  return { expired, expiresToday, expiresInAWeek, expiresInAMonth }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  handleAddNew: () => dispatch(itemEditActions.itemInCreation),
  handleDone: (item, value) => dispatch(itemActions.updateItemQuantity(item, value)),
  handleUndo: (id) => dispatch(itemActions.undoItemChanges(id))
})

function formatDateText(datestr) {
  const date = parseISO(datestr)
  if (isToday(date)) {
    return 'today'
  }
  const dateformat = formatDistanceToNow(date)
  if (isPast(date)) {
    return dateformat + ' ago'
  }
  return dateformat
}

function createWidgetIfNotEmpty(title, items, handleDone, handleUndo, hideHeader) {
  if (items && items.length > 0) {
    return (
      <Grid item xs={12}>
        <ExpireSoonList title={title} handleRemove={handleDone} handleUndo={handleUndo} showHeader={!hideHeader}
          items={items.map(i => Object.assign({}, i, { datedescript: formatDateText(i.date) }))}
        />
      </Grid>
    )
  }
}

function MainContent(props) {
  const classes = useStyles();
  //const fixedHeightPaper = clsx(classes.paper, classes.fixedHeight);
  syncMonkey.reset()
  const { expired, handleDone, handleUndo, expiresToday, expiresInAWeek, expiresInAMonth } = props
  let anyItems = false;
  const expiredWidget = createWidgetIfNotEmpty('Already expired', expired, handleDone, handleUndo, anyItems)
  anyItems = anyItems || expiredWidget
  const expiresTodayWidget = createWidgetIfNotEmpty('Expires today', expiresToday, handleDone, handleUndo, anyItems)
  anyItems = anyItems || expiresTodayWidget
  const expiresWeekWidget = createWidgetIfNotEmpty('In a week', expiresInAWeek, handleDone, handleUndo, anyItems)
  anyItems = anyItems || expiresWeekWidget
  const expiresMonthWidget = createWidgetIfNotEmpty('In a month', expiresInAMonth, handleDone, handleUndo, anyItems)

  const anyWidget = expiredWidget || expiresTodayWidget || expiresWeekWidget || expiresMonthWidget

  let superWidget
  if (!anyWidget) {
    superWidget = (
      <Grid item xs={12}>
        <Title>Great news!</Title>
        <Fragment>
          No items will expire in the nearest future. You are really lucky.
          </Fragment>
      </Grid >
    )
  }

  return (
    <div>
      <Paper className={classes.paper}>
        <Grid container spacing={3}>
          {/* Chart }
        <Grid item xs={12} md={8} lg={9}>
          <Paper className={fixedHeightPaper}>
            <Chart />
          </Paper>
        </Grid>
        {Recent Deposits}
        <Grid item xs={12} md={4} lg={3}>
          <Paper className={fixedHeightPaper}>
            <Deposits />
          </Paper>
        </Grid>
        {/* Recent Orders */}
          {expiredWidget}
          {expiresTodayWidget}
          {expiresWeekWidget}
          {expiresMonthWidget}
          {superWidget}
        </Grid>
      </Paper>
      <Fab color="primary" aria-label="add" className={classes.floatRight} onClick={props.handleAddNew}>
        <AddIcon />
      </Fab>
    </div>
  )
}

export default connect(mapStateToProps, mapDispatchToProps)(MainContent)