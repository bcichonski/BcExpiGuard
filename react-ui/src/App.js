import React from 'react';
import { useMediaQuery } from 'react-responsive'
import Dashboard from './components/Dashboard'
import './App.css';

function App() {
  const isMobile = useMediaQuery({maxDeviceWidth : 1000})

  return (
    <div className="App">
      <Dashboard isMobile={isMobile} />
    </div>
  );
}

export default App;
