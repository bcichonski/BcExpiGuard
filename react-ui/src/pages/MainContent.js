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
import { parseISO, differenceInDays, differenceInHours, formatDistanceToNow, isPast, isToday } from 'date-fns'
import Title from '../components/Title'

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

function onlyExpired(today) {
  return (item) => differenceInDays(parseISO(item.date), today) < 0 && onlyActive(item)
}

function changedToday(item, today) {
  const diff = differenceInHours(parseISO(item.date), today)
  return diff >= 0 && diff < 24
}

function onlyExpiresWithinDays(today, from, to) {
  return (item) => {
    const diff = differenceInDays(parseISO(item.date), today)
    return diff >= from && diff < to && (onlyActive(item) || (onlyNotRemoved(item) && changedToday(item)))
  }
}

function normalize(collection, state) {
  return collection.map(item => ({
    ...item,
    name : state.itemNameReducer.find(nm => nm.id === item.nameID).name ?? item.nameID,
  }))
}

const mapStateToProps = (state, ownProps) => {
  const today = new Date()
  const expired = normalize(state.itemReducer.filter(onlyExpired(today)), state)
  const expiresToday = normalize(state.itemReducer.filter(onlyExpiresWithinDays(today, 0, 1)), state);
  const expiresInAWeek = normalize(state.itemReducer.filter(onlyExpiresWithinDays(today, 1, 7)), state);
  const expiresInAMonth = normalize(state.itemReducer.filter(onlyExpiresWithinDays(today, 7, 30)), state);

  return { expired, expiresToday, expiresInAWeek, expiresInAMonth }
}

const mapDispatchToProps = (dispatch, ownProps) => ({
  handleAddNew: () => dispatch(itemEditActions.itemInCreation),
  handleDone: (id, value) => dispatch(itemActions.updateItem(id, value)),
  handleUndo: (id) => dispatch(itemActions.undoItemChanges(id))
})

function formatDateText(datestr) {
  const date = parseISO(datestr)
  if(isToday(date)) {
    return 'today'
  }
  const dateformat = formatDistanceToNow(date)
  if(isPast(date)) {
    return dateformat+' ago'
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
          No items will expire in nearest future. You are really lucky man.
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