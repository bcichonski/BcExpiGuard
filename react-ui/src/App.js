import React from 'react';
import { useMediaQuery } from 'react-responsive'
import Layout from './components/Layout'
import { BrowserRouter as Router } from "react-router-dom"

function App() {
  const isMobile = useMediaQuery({ maxDeviceWidth: 1000 })

  return (
    <div className="App">
      <Router>
        <Layout isMobile={isMobile} />
      </Router>
    </div>
  );
}

export default App;
