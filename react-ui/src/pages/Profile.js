import React, { Fragment } from "react";
import { useAuth0 } from "../common/auth0";
import Database from '../persistence'
import { NAMESPACES, createUUID } from '../common/utils'

const Profile = () => {
  const { loading, user, getTokenSilently } = useAuth0();

  if (loading || !user) {
    return <div>Loading...</div>;
  }

  const handleClick = async () => {
    const id = createUUID(NAMESPACES.UserId, user.email)
    const db = await Database.UseUser(user, getTokenSilently);
    await db.users.put({_id: id , userEmail : user.email})
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