import { Auth0Provider } from '@auth0/auth0-react';
import { useNavigate } from 'react-router';
import { AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_AUDIENCE } from '../constants/config';

// Rendered inside the router so the Auth0 redirect callback can navigate (replace keeps ?code&state out of history).
// Cache location and refresh tokens stay at the SDK defaults (memory, no refresh tokens), as in the v1 setup.
function Auth0ProviderWithNavigate({ children }) {
  const navigate = useNavigate();
  const onRedirectCallback = (appState) => {
    navigate(appState?.targetUrl || window.location.pathname, { replace: true });
  };

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: AUTH0_AUDIENCE,
      }}
      onRedirectCallback={onRedirectCallback}
    >
      {children}
    </Auth0Provider>
  );
}

export default Auth0ProviderWithNavigate;
