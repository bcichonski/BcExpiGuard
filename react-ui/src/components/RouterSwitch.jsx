import { Routes, Route } from 'react-router'
import MainContent from '../pages/MainContent'
import AddItem from '../pages/AddItem'
import BrowseItems from '../pages/BrowseItems'
import Profile from '../pages/Profile'
import LandingPage from '../pages/LandingPage'
import Restricted from './Restricted'

function RouterSwitch() {
    return (
        <Routes>
            <Route path='/' element={<Restricted component={MainContent} />} />
            <Route path='/item/add' element={<Restricted component={AddItem} />} />
            <Route path='/item/edit' element={<Restricted component={AddItem} />} />
            <Route path='/items' element={<Restricted component={BrowseItems} />} />
            <Route path='/profile' element={<Restricted component={Profile} />} />
            <Route path='/welcome' element={<LandingPage />} />
        </Routes>
    );
}

export default RouterSwitch
