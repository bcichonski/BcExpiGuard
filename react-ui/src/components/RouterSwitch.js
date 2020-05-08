import React from 'react';
import { Router } from '@reach/router'
import MainContent from '../containers/MainContent'
import Chart from './Chart'

export default function RouterSwitch() {
    return (
        <Router>
            <MainContent path='/' />
            <Chart path='/reports' />
        </Router>
    );
}