import React, { useEffect, Fragment } from "react";
import { useAuth0 } from "../common/auth0";
import { Redirect } from "@reach/router"

function Restricted({component : Component, ...rest}) {
    const { loading, isAuthenticated, loginWithRedirect } = useAuth0();

    /*useEffect(() => {
        if (loading || isAuthenticated) {
            return;
        }
        const fn = async () => {
            await loginWithRedirect({
                appState: { targetUrl: window.location.pathname }
            });
        };
        fn();
    }, [loading, isAuthenticated, loginWithRedirect, path]);*/

    if(isAuthenticated) {
        return (
            <Component {...rest}/>
        )
    } else {
        return (<Redirect to="/welcome" noThrow />);
    }
}

export default Restricted;