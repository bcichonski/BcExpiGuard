import React, { Fragment } from "react";
import { useAuth0 } from "../common/auth0";


const Profile = () => {
  const { loading, user } = useAuth0();

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Fragment>
      <img src={user.picture} alt="Profile" />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <span>Below is all intel about you we have access to. We care only about your email to distinguish you from billions of others.</span>
      <code>{JSON.stringify(user, null, 2)}</code>
    </Fragment>
  );
};

export default Profile;