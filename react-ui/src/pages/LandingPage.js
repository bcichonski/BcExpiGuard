import React, { Fragment, useEffect } from "react";
import dbProvider from '../persistence'
import { useAuth0 } from "../common/auth0";

const LandingPage = () => {
  const { isAuthenticated } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated) {
      const asyncLogout = async () => {
        await dbProvider.Logout()
      }
      asyncLogout()
    }
  }, [isAuthenticated]);

  return (
    <Fragment>
      <h2>Landing Page</h2>
      <div>What a shame!</div>
    </Fragment>
  );
};

export default LandingPage;