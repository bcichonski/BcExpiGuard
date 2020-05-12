import React from 'react';
import { Router } from '@reach/router'
import MainContent from '../containers/MainContent'
import AddItem from '../containers/AddItem'
import BrowseItems from '../containers/BrowseItems'
import Chart from './Chart'

export default function RouterSwitch() {
    return (
        <Router>
            <MainContent path='/' />
            <Chart path='/reports' />
            <AddItem path='/item/add' />
            <BrowseItems path='/items' />
        </Router>
    );
}