import React from 'react';
import { Router } from '@reach/router'
import MainContent from '../pages/MainContent'
import AddItem from '../pages/AddItem'
import BrowseItems from '../pages/BrowseItems'
import Profile from '../pages/Profile'
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