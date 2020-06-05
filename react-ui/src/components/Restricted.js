import React, { useEffect, Fragment } from "react";
import { useAuth0 } from "../common/auth0";
import { Redirect } from "@reach/router"

function Restricted({component : Component, ...rest}) {
    const { isAuthenticated } = useAuth0();

    if(isAuthenticated) {
        return (
            <Component {...rest}/>
        )
    } else {
        return (<Redirect to="/welcome" noThrow />);
    }
}

export default Restricted;