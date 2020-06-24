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
      <h1>Welcome!</h1>
      <h2>What is this?</h2>
      <div>Put all your stuff that will not last forever in one place.
      Always know what to use or do to avoid unnecessary waste or stress. Keep your data synchronized across multiple devices,
      web, desktop or mobile.
      </div>
      <h2>Why should I use that?</h2>
      <div>Generally you could use text file for that purpose or some kind of cloud-based spreedsheet solution. 
        Would that be really effective and convinient? For some people it would. For the others, who boldly go where no man has gone before, except the author of course it would not.</div>
      <h2>Why did you do this (to me)?</h2>
      <div>Mostly because I wanted to refresh my React-related skillset and I value more solutions that actually do something (even something so narrow in scope).
        And since it is not-so-serious project I can choose tech stack freely and experiment with stuff like PWA, couchdb and more.
      </div>
      <h3>A sort of legal-ish note</h3>
      <div>Software is provided as is, without any kind of promisses to be useful. 
        By logging you are giving consent to this terms. 
        Google account is necessary in order to log in. 
        You are responsible for all the content that you put into the app and share with other people. 
        Your data will be stored on all devices where you will log into or install the app. 
        Your data also will be sent to cloud service located somewhere in EU. 
        All communication is done through secure https connections.
        The app has access to basic info about your google account and process your email address which is your personal data according to The Regulation (EU) 2018/1807.
      </div>
      <h1>Live long and prosper!</h1>
    </Fragment>
  );
};

export default LandingPage;