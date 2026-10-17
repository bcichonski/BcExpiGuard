import { Fragment } from 'react';
import { useAuth0 } from "@auth0/auth0-react";


const Profile = () => {
  const { isLoading, user } = useAuth0();

  if (isLoading || !user) {
    return <div>Loading...</div>;
  }

  return (
    <Fragment>
      <img src={user.picture} alt="Profile" />
      <h2>{user.name}</h2>
      <p>{user.email}</p>
      <p>Below is all the intel about you we have access to. We care only about your email to distinguish you from other people.</p>
      <code><pre>{JSON.stringify(user, null, 2)}</pre></code>
    </Fragment>
  );
};

export default Profile;