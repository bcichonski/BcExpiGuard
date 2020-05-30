import React from 'react';
import { Router } from '@reach/router'
import MainContent from '../containers/MainContent'
import AddItem from '../containers/AddItem'
import BrowseItems from '../containers/BrowseItems'
import Profile from '../components/Profile'
import Chart from './Chart'
import PropTypes from 'prop-types';

function RouterSwitch(props) {
    return (
        <Router history={props.history}>
            <MainContent path='/' />
            <Chart path='/reports' />
            <AddItem path='/item/add' />
            <BrowseItems path='/items' />
            <Profile path='/profile' />
        </Router>
    );
}

RouterSwitch.propTypes = {
    history : PropTypes.object
}

export default RouterSwitch