import React from 'react';
import { useMediaQuery } from 'react-responsive'
import Layout from './components/Layout'
import './App.css';

function App() {
  const isMobile = useMediaQuery({maxDeviceWidth : 1000})

  return (
    <div className="App">
      <Layout isMobile={isMobile} />
    </div>
  );
}

export default App;
