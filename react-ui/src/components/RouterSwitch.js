import React from 'react';
import { Router } from '@reach/router'
import MainContent from '../pages/MainContent'
import AddItem from '../pages/AddItem'
import BrowseItems from '../pages/BrowseItems'
import Profile from '../pages/Profile'
import LandingPage from '../pages/LandingPage'
import Restricted from './Restricted'
import PropTypes from 'prop-types';

function RouterSwitch(props) {
    return (
        <Router history={props.history}>
            <Restricted component={MainContent} path='/' />
            <Restricted component={AddItem} path='/item/add' />
            <Restricted component={BrowseItems} path='/items' />
            <Restricted path='/profile' component={Profile}>
            </Restricted>
            <LandingPage path='/welcome' />
        </Router>
    );
}

RouterSwitch.propTypes = {
    history: PropTypes.object
}

export default RouterSwitch