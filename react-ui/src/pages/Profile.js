import React, { Fragment } from "react";
import { useAuth0 } from "../common/auth0";
import { users } from '../persistence'


const Profile = () => {
  const { loading, user } = useAuth0();

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  const handleClick = async () => {
    users.add(user)
  }

  return (
    <Fragment>
      <img src={user.picture} alt="Profile" />
      <button onClick={handleClick}>Test</button>
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <code>{JSON.stringify(user, null, 2)}</code>
    </Fragment>
  );
};

export default Profile;