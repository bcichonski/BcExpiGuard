import React from 'react';
import { useMediaQuery } from 'react-responsive'
import Layout from './containers/Layout'
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';


function App() {
  const isMobile = useMediaQuery({ maxDeviceWidth: 1000 })

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
    <div className="App">
      <Layout isMobile={isMobile} />
    </div>
    </MuiPickersUtilsProvider>
  );
}

export default App;
