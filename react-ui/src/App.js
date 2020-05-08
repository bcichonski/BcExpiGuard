import React from 'react';
import { useMediaQuery } from 'react-responsive'
import Layout from './containers/Layout'

function App() {
  const isMobile = useMediaQuery({ maxDeviceWidth: 1000 })

  return (
    <div className="App">
      <Layout isMobile={isMobile} />
    </div>
  );
}

export default App;
